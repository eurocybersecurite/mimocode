# mimocode 🚀

**mimocode** est un ingénieur IA autonome 100% local, puissant et flexible. Contrairement aux chatbots classiques, Mimocode est un **agent** capable d'agir directement sur votre système de fichiers et d'exécuter des commandes shell pour accomplir vos tâches.

## ✨ Fonctionnalités

- **Autonomie Réelle** : Mimocode ne se contente pas de parler, il **agit**. Il crée, modifie, teste et déploie du code en utilisant ses outils intégrés.
- **CLI Terminal Interactif** : Une expérience fluide avec autocomplétion, historique persistant, rendu Markdown riche et commandes slash. **Nouveau : Affichage structuré style Gemini CLI.**
- **Interface Web Moderne** : Gestion complète des agents, explorateur de fichiers avec auto-save, historique de chat complet, historique d'exécution riche et monitoring à distance.
- **Planification Avancée (`/plan`)** : Capacité à décomposer une tâche complexe en étapes et à les exécuter de manière autonome avec auto-correction en cas d'échec.
- **Sécurité & Contrôle** : Système de permissions interactif pour les actions critiques (exécution de commandes, modification/suppression de fichiers) avec **prévisualisation des changements (diff)**.
- **Multi-Agents Collaboratifs** : Orchestration de plusieurs agents spécialisés (Architecte, Coder, Debugger).
- **Outils MCP (Model Context Protocol)** : Accès direct au système de fichiers, recherche ultra-rapide et bootstrapping de projets (Java, Python, React, Rust, etc.).
- **100% Local** : Respect total de la vie privée, fonctionne avec Ollama, LM Studio ou tout runtime compatible OpenAI local.

## 🛠️ Installation

### 1. Prérequis
- **Node.js** (v18+)
- **Ollama** (recommandé) ou tout autre runtime compatible OpenAI/Gemini local.
- **ripgrep** (optionnel, pour des recherches ultra-rapides via `mimocode search`).

### 2. Installation Propre (Mac/Linux)
Si vous aviez une version précédente, il est recommandé de faire un nettoyage complet :

```bash
# 1. Aller dans votre projet
cd /votre/chemin/vers/mimocode-cli

# 2. Supprimer l'ancien lien global
npm unlink -g mimocode

# 3. Nettoyer les caches et dépendances
rm -rf node_modules package-lock.json
npm cache clean --force

# 4. Réinstaller les dépendances
npm install

# 5. Rendre exécutable le point d'entrée
chmod +x bin/mimocode.js

# 6. Créer le nouveau lien global
npm link

# 7. Vérifier l'installation
which mimocode
mimocode --version
```

### 3. Configuration
Au premier lancement, Mimocode vous guidera via un menu interactif :
```bash
mimocode --setup
```

## 🚀 Utilisation du CLI

### Commandes de base
- **Chat interactif** : `mimocode`
- **Question directe** : `mimocode "comment faire X ?"`
- **Changer de modèle** : `/models` (dans le chat)
- **Aide** : `mimocode --help`

### 🔍 Dépannage (Troubleshooting)

**Erreur `ERR_MODULE_NOT_FOUND` ou chemin pointant vers `.Trash` :**
Si vous voyez une erreur indiquant que Node cherche un module dans la corbeille (`.Trash`), cela signifie que votre lien `npm link` est corrompu.
**Solution :**
1. Supprimez le lien : `npm unlink -g mimocode`
2. Assurez-vous d'être dans le bon dossier (pas dans la corbeille !)
3. Refaites `npm link` depuis le dossier source actuel.

**Erreur `Empty response from LLM` :**
Vérifiez que votre backend (Ollama, LM Studio) est bien lancé et que le modèle sélectionné est chargé.

### Gestion des Agents (`mimocode agents`)
- `mimocode agents list` : Lister vos agents locaux.
- `mimocode agents create <name> --role "..." --persona "..."` : Créer un nouvel agent.
- `mimocode agents run <name> "tâche"` : Exécuter un agent spécifique.
- `mimocode agents delete <name>` : Supprimer un agent (avec confirmation).
- `mimocode agents export <name> <path>` : Exporter la configuration d'un agent.

### Outils MCP (`mimocode mcp`)
- `mimocode mcp list` : Lister les outils disponibles.
- `mimocode mcp fast-search <pattern>` : Recherche ultra-rapide via ripgrep.
- `mimocode mcp delete-file <path>` : Supprimer un fichier (avec confirmation).
- `mimocode mcp create-directory <path>` : Créer un dossier.

### RAG & Mémoire (`mimocode rag` / `mimocode memory`)
- `mimocode rag index <path>` : Indexer un répertoire pour la recherche sémantique.
- `mimocode rag query "question"` : Poser une question sur vos documents indexés.
- `mimocode rag clear` : Vider l'index RAG (avec confirmation).
- `mimocode memory add "fait"` : Enregistrer une information importante.
- `mimocode memory search "requête"` : Rechercher dans la mémoire à long terme.

### Commandes Slash (dans le chat interactif)
- `/help` : Liste des commandes disponibles.
- `/set temperature 0.7` : Ajuster les paramètres du modèle à la volée.
- `/heal --fix` : Lancer une auto-réparation du système (avec confirmation).
- `/improve --apply` : Appliquer des optimisations au code (avec confirmation).
- `/restore --latest` : Revenir au dernier état stable (avec confirmation).
- `/clear` : Effacer l'historique du chat actuel.

## 🌐 Interface Web

Lancez le serveur :
```bash
npm run dev
```
Accédez à l'interface sur [http://localhost:3000](http://localhost:3000).
L'interface web permet de :
- Gérer visuellement vos agents (édition, création, suppression).
- Visualiser les sorties riches (Markdown, Code Highlighting).
- **Consulter l'historique complet des conversations (onglet Chat History).**
- **Éditer vos fichiers avec sauvegarde automatique (onglet Files).**
- Accéder aux actions critiques via le menu **Settings**.
- Consulter l'historique complet des exécutions.

## 📁 Structure du projet
- `src/cli/` : Logique du CLI, outils MCP, RAG et intégrations LLM.
- `src/App.tsx` : Interface web React (Terminal XTerm.js + Dashboard).
- `server.ts` : Serveur Express gérant l'exécution des commandes et l'API.
- `bin/` : Point d'entrée pour l'exécutable global.

## 🛡️ Sécurité
`mimocode` inclut des protections contre les actions destructrices accidentelles. Les commandes comme `delete`, `clear`, `restore`, `heal --fix` et `improve --apply` demandent systématiquement une confirmation utilisateur.

**Nouveau :** Lors d'une modification de fichier par l'IA, Mimocode affiche désormais un **diff coloré** (style Gemini CLI) vous permettant de valider précisément les changements avant qu'ils ne soient appliqués.
