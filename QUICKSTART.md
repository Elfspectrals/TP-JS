# Guide de démarrage rapide

## Étapes pour lancer l'application

### 1. Configuration Supabase (5 minutes)

1. Créez un compte sur [supabase.com](https://supabase.com) (gratuit)
2. Créez un nouveau projet
3. Allez dans **Settings** → **API**
4. Copiez :
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`

### 2. Configurer les clés

Ouvrez `supabase-config.js` et remplacez :

```javascript
const SUPABASE_URL = 'VOTRE_URL_ICI';
const SUPABASE_ANON_KEY = 'VOTRE_CLE_ICI';
```

### 3. Créer les tables

1. Dans Supabase, allez dans **SQL Editor**
2. Ouvrez le fichier `supabase-setup.sql` de ce projet
3. Copiez tout le contenu
4. Collez-le dans l'éditeur SQL de Supabase
5. Cliquez sur **Run** (ou F5)

✅ Les tables et politiques de sécurité sont maintenant créées !

### 4. Lancer l'application

```bash
# Installer les dépendances (optionnel, car on utilise CDN)
npm install

# Lancer un serveur local
npm start
```

Ou utilisez n'importe quel serveur HTTP local :
- Python : `python -m http.server 8000`
- Node : `npx serve .`
- PHP : `php -S localhost:8000`

### 5. Tester l'application

1. Ouvrez `http://localhost:8000` (ou le port indiqué)
2. Créez un compte avec un email et mot de passe
3. Remplissez votre profil (poids, taille, âge)
4. Ajoutez votre première séance d'entraînement !
5. Visualisez vos statistiques dans le tableau de bord

## Structure des données

### Tables créées

- **user_profiles** : Profils utilisateurs (poids, taille, âge)
- **workouts** : Séances d'entraînement
- **goals** : Objectifs de performance

### Sécurité

Toutes les tables utilisent **Row Level Security (RLS)** :
- Chaque utilisateur ne peut voir/modifier que ses propres données
- Les politiques sont automatiquement appliquées

## Dépannage

### Erreur "supabase is not defined"
- Vérifiez que les scripts CDN se chargent correctement
- Ouvrez la console du navigateur (F12) pour voir les erreurs

### Erreur "relation does not exist"
- Vérifiez que vous avez bien exécuté le script SQL `supabase-setup.sql`
- Vérifiez que les noms de tables sont corrects

### Les graphiques ne s'affichent pas
- Vérifiez que Chart.js se charge (console navigateur)
- Assurez-vous d'avoir des données (ajoutez des entraînements)

### L'authentification ne fonctionne pas
- Vérifiez vos clés Supabase dans `supabase-config.js`
- Vérifiez que l'email de confirmation n'est pas requis (Settings → Auth → Email)

## Fonctionnalités à tester

✅ Inscription/Connexion  
✅ Ajout d'entraînement  
✅ Modification/Suppression d'entraînement  
✅ Graphique camembert (mise à jour en temps réel)  
✅ Graphiques de tendance (calories et temps)  
✅ Création d'objectifs  
✅ Alertes d'objectifs non atteints  
✅ Filtres par catégorie  
✅ Calcul automatique des calories  

Bon développement ! 🏋️

