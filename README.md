# Webauftritt

Aufgabe aus Informatik

## Installation

1. Es muss NodeJS (https://nodejs.org) und npm installiert sein
2. Die notwendigen Pakete installieren

```sh
npm i
```
3. Den Webserver starten
```sh
node app.js;
```

## Weitere Informationen

* Die Unterseite "Anmelden" funktioniert. Zum anmelden lässt sich als Benutzername "admin" und als Passwort "password" verwenden. Über den Pfad /user/admin lässt sich außerdem dieses Passwort wieder zurücksetzen, falls es nicht funktioniert.
* Ein neuer Benutzer lässt sich anlegen mit einem POST-Request an /api/users/new erstellen. Dafür sollte im body dieses JSON-Format mitgeliefert werden:

```json
{
    "username": "BENUTZERNAME",
    "password": "PASSWORT"
}
```

wobei "BENUTZERNAME" und "PASSWORT" jeweils zu ersetzen sind.

* Es lassen sich bei der Produkte Seite Wahrenkörbe zusammenstellen, welche man anschließend einsehen kann.