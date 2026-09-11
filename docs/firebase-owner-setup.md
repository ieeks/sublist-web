# Manueller Schritt: Firebase nur für Manuel freigeben

Die Codekorrekturen können separat gemergt werden. Der Zugriffsschutz ist erst nach
folgenden Console-Schritten aktiv. Die Konsole und Repository-Secrets sind über die
in dieser Sitzung verfügbaren GitHub-Werkzeuge nicht administrierbar.

1. **Daten sichern:** Vor Umstellung Abos und Zahlungshistorie privat exportieren.
   Vorhandene Firestore-Regeln ebenfalls sichern. Keine Daten/Exports in öffentliche Issues laden.
2. **Google-Anmeldung aktivieren:** Firebase Console → Authentication → Sign-in method →
   Google aktivieren und Support-E-Mail wählen. Unter Settings → Authorized domains
   `ieeks.github.io` ergänzen, gegebenenfalls die tatsächlich verwendete eigene Domain.
3. **Erste Anmeldung / UID:** Nach Merge den GitHub-Repository-Secret
   `NEXT_PUBLIC_FIREBASE_ALLOWED_UID` zunächst auf `SETUP_PENDING` setzen und den
   Pages-Workflow neu starten. Die Anwendung zeigt jetzt die Google-Anmeldung.
   Einmal mit dem gewünschten Google-Konto anmelden. Das Konto erhält zunächst
   absichtlich keinen App-Zugriff. In Firebase → Authentication → Users dessen UID kopieren.
4. **Owner festlegen:** Den Secret `NEXT_PUBLIC_FIREBASE_ALLOWED_UID` durch diese UID
   ersetzen und den Pages-Workflow neu starten. Keine Google-Passwörter oder Tokens
   in GitHub-Secrets eintragen. Der Firebase-UID-Wert dient nur zur Auswahl des Owners.
5. **Serverseitige Regeln publizieren:** Im vorhandenen Ruleset den Zugriff für
   `/sublist/data` auf genau diese UID einschränken:

   ```text
   match /sublist/data {
     allow read, write: if request.auth != null
                        && request.auth.uid == 'HIER_DIE_EIGENE_UID';
   }
   ```

   Regeln anderer Apps im selben Firebase-Projekt beibehalten. Wichtig: Ein breiteres
   `match /{document=**}` mit öffentlichem Allow würde diese Einschränkung überstimmen.
   Alle überlappenden Freigaben für diesen Pfad müssen ebenfalls entfernt/begrenzt
   werden. Ein restriktiver Match hebt ein anderweitiges Allow nicht auf.
6. **Rules Playground:** Für `/sublist/data` Lesen, Erstellen/Ändern und Löschen prüfen:
   ohne Anmeldung verweigert, andere UID verweigert, eigene UID erlaubt.
7. **End-to-end:** Erfolgreiches Deployment abwarten. Im privaten Browser muss die
   Anmeldung erscheinen. Das eigene Konto muss vorhandene Abos sehen und speichern
   können; ein anderes Konto darf die Daten nicht sehen. Falls Firestore nach
   Regelnänderung vorübergehend ablehnt, Seite neu laden.
8. **Alte Tabs schließen:** Die alten App-Versionen auf allen Geräten schließen und
   neu laden. Der neue Login und die neuen Schreibregeln sollen überall gelten.

Der UID-Schalter allein sichert Firestore **nicht** ab. Entscheidend sind die
veröffentlichten Rules. Ohne UID-Konfiguration bleibt die bisherige Anmeldelogik
für einen gestuften Rollout unverändert.

Bei Problemen die konkrete Fehlermeldung melden, ohne private Daten oder Credentials.
Nicht auf öffentliche Schreibrechte zurückstellen.

Referenzen: https://firebase.google.com/docs/auth/web/google-signin
und https://firebase.google.com/docs/firestore/security/rules-conditions
