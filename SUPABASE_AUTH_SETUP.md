# Configuration de l'authentification Supabase

## Problème: "Email address is invalid"

Si vous obtenez l'erreur "Email address is invalid" lors de l'inscription, cela vient des **paramètres d'authentification Supabase**, pas de la base de données.

## Solution: Configurer l'authentification

### 1. Accéder aux paramètres d'authentification

1. Allez dans votre projet Supabase
2. Cliquez sur **Settings** (Paramètres)
3. Cliquez sur **Authentication** dans le menu de gauche
4. Cliquez sur **Email** dans les sous-sections

### 2. Paramètres à vérifier

#### ✅ Activer l'inscription par email
- **Enable email signup** : Doit être **activé** (ON)

#### ✅ Confirmation d'email (optionnel)
- **Confirm email** : 
  - Si **activé** : L'utilisateur doit confirmer son email avant de se connecter
  - Si **désactivé** : L'utilisateur peut se connecter immédiatement après l'inscription
  - **Recommandé pour le développement** : Désactiver pour tester rapidement

#### ✅ Restrictions d'email
- **Email domain allowlist** : 
  - Si vide : Tous les emails sont acceptés
  - Si rempli : Seuls les domaines listés sont acceptés (ex: `gmail.com`, `outlook.com`)
  - **Vérifiez que votre domaine d'email est autorisé ou laissez vide**

### 3. Autres paramètres utiles

#### Rate limiting
- **Enable rate limiting** : Peut limiter les tentatives d'inscription
- Pour le développement, vous pouvez le désactiver temporairement

#### Password requirements
- **Minimum password length** : Par défaut 6 caractères
- Vérifiez que votre mot de passe respecte cette longueur

## Vérification rapide

Après avoir modifié les paramètres :

1. Rechargez votre application
2. Essayez de vous inscrire à nouveau
3. Si l'erreur persiste, vérifiez la console du navigateur pour plus de détails

## Configuration recommandée pour le développement

```
✅ Enable email signup: ON
❌ Confirm email: OFF (pour tester rapidement)
📧 Email domain allowlist: Vide (tous les emails acceptés)
🔒 Minimum password length: 6
```

## Configuration recommandée pour la production

```
✅ Enable email signup: ON
✅ Confirm email: ON (sécurité)
📧 Email domain allowlist: Selon vos besoins
🔒 Minimum password length: 8 ou plus
```



