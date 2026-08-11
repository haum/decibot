Dépôt pour la course de robot tondeuse pour teriaki 2026

## Contenu

- `firmware_app/decibot/` — firmware du robot (MicroPython, ESP32)
- `firmware_app/remotecmd/` — firmware de la télécommande (MicroPython, ESP8266)
- `mic_debug_aquisition.py` — script PC pour capturer le son des micros du robot

Les deux firmwares partagent la même ossature : gestion du wifi, configuration
persistante en JSON, serveur web asynchrone et interface web embarquée.

## Principe du robot

Deux micros I2S (gauche et droit) alimentent chacun deux filtres exponentiels :
un rapide (`mic_filter_5tau_fast`, 0,5 s) et un lent (`mic_filter_5tau_slow`,
4 s). Quand le niveau rapide d'un côté dépasse le niveau lent de ce côté
multiplié par `mic_filter_ratio`, le moteur correspondant est commandé. Le
robot réagit donc à une montée de bruit relative à son ambiance, et non à un
niveau absolu.

## Installation

1. Flasher MicroPython sur la carte.
2. Copier le paquet voulu à la racine du système de fichiers, en conservant le
   nom du dossier (`decibot/` ou `remotecmd/`), fichiers statiques compris.
3. Créer un `main.py` à la racine qui démarre l'application :

   ```python
   import decibot
   decibot.start()
   ```

   (ou `remotecmd` pour la télécommande)

4. Créer un `wifi.dat` à la racine, une ligne par réseau, par ordre de
   priorité décroissante :

   ```
   ssid1;motdepasse1
   ssid2;motdepasse2
   ```

   Les réseaux peuvent aussi être ajoutés et réordonnés depuis l'interface web.

Au premier démarrage, si la bibliothèque `aiowebserver` est absente, elle est
téléchargée automatiquement via `mip` depuis
`github:haum/micropython-aiowebserver` — la carte doit donc pouvoir joindre
internet à ce moment-là.

## Interface web

La carte prend le nom d'hôte `decibot-xxxxxx` (ou `remotecmd-xxxxxx`), où
`xxxxxx` est la fin de son adresse MAC, et sert son interface sur le port 80.
L'adresse IP est également affichée sur la console série au moment de la
connexion.

L'interface est découpée en sections dépliables : micros, moteurs, capteurs,
MicCtrl, UDPcmd, config et wifi. L'indicateur à gauche du titre montre l'état
de la liaison temps réel ; un clic droit dessus permet d'en changer la période
de rafraîchissement (50 à 2550 ms).

## Sécurité

Trois mécanismes coupent les moteurs, quelle que soit la source de commande
(micros, joystick web ou UDP) :

- le bouton d'arrêt (`pin_stop1` / `pin_stop2`) ;
- la détection de soulèvement des deux roues (`pin_wheel_l` et `pin_wheel_r`) ;
- un chien de garde : si plus aucune commande n'arrive pendant
  `cmd_timeout_ms` (300 ms par défaut), les moteurs sont arrêtés.

Une source de commande distante doit donc rafraîchir sa consigne plus vite que
`cmd_timeout_ms`, même quand celle-ci ne change pas.

## Protocole UDP de commande

Le robot écoute sur `listen_ip:listen_port` (`0.0.0.0:1234` par défaut), une
fois la réception activée depuis l'interface web ou via `GET /udpcmd/on`.

Chaque datagramme fait exactement 5 octets, au format `struct` `>Bf` :

| Champ | Taille | Description |
| --- | --- | --- |
| drapeaux | 1 octet | quartet de poids faible : numéro du robot (`bot_nr`) ; quartet de poids fort : `0` pour le moteur droit, non nul pour le moteur gauche |
| consigne | 4 octets | flottant big endian, borné à [-1, 1] |

Un datagramme ne pilote qu'un seul moteur : il en faut deux pour commander le
robot. Les datagrammes dont le numéro de robot ne correspond pas sont ignorés,
ce qui permet d'adresser plusieurs robots sur le même port, en diffusion.

## Capture du son des micros

Le robot peut recopier le flux audio brut vers un PC, en UDP :

```
./mic_debug_aquisition.py --ip <ip-du-robot> --local-ip <ip-du-pc> --file capture.wav
```

Le script arme la recopie, écrit un WAV stéréo 16 bits à 22050 Hz, et désarme
la recopie à l'arrêt (Ctrl-C). L'armement peut aussi se faire à la main avec
`GET /debug_mic_addr/<ip>:<port>`, et se couper avec
`GET /debug_mic_addr/None`.

## Configuration

Les réglages sont persistés dans `decibot_config.json` et
`remotecmd_config.json`, écrits depuis la page de configuration. Les valeurs
par défaut sont dans `config.py` : elles ne sont utilisées que pour les clés
absentes du fichier, donc changer une valeur par défaut n'a aucun effet sur une
carte déjà configurée.

Le brochage est modifiable dans la configuration mais affiché en lecture seule
dans l'interface, pour éviter de perdre l'accès à une carte en service.
