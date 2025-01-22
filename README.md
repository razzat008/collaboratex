<<<<<<< HEAD
# Collaboratex Frontend

The frontend for this project uses **React and Vite**. This project also uses **pnpm** instead of npm.

Steps for running the project:

- Clone this project repo.
- Change the directory to frontend.
- Run `pnpm install`. This will install necessary packages as configured in the `package.json`.
- Run `pnpm run dev` to start the project via vite.

Also current directory structure:

        .
        ├── eslint.config.js
        ├── index.html
        ├── package.json
        ├── pnpm-lock.yaml
        ├── postcss.config.js
        ├── public
        │   └── vite.svg
        ├── README.md
        ├── src
        │   ├── App.css
        │   ├── App.jsx
        │   ├── assets
        │   │   └── react.svg
        │   ├── components
        │   │   ├── Footer
        │   │   │   └── Footer.jsx
        │   │   ├── Main
        │   │   │   └── Main.jsx
        │   │   └── Navbar
        │   │       └── Navbar.jsx
        │   ├── index.css
        │   ├── main.jsx
        │   └── pages
        │       ├── Features.jsx
        │       ├── Login.jsx
        │       ├── Signup.jsx
        │       └── Templates.jsx
        ├── tailwind.config.js
        └── vite.config.js


            
=======
# Collaboratex

Collaboratex is a collaborative LaTeX editor designed for Kathmandu University (KU). The platform addresses the limitations of existing online LaTeX editors, such as no. of user restrictions and inadequate support for collaborative workflows.

The project is based on MERN stack.

### Developer Guide:

#### Prerequisites
 - **NodeJS**
```bash
# Current LTS version: 22.12.0
curl -sL https://deb.nodesource.com/setup_22.x | sudo -E bash - 
```
```bash
sudo apt install nodejs -y
```
```bash
node -v
```
---
 - **pnpm**
```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```
```bash
export PATH="$HOME/.local/share/pnpm:$PATH"
```
Verify the installation:
```bash
pnpm --version
```
---
 - **MongoDB**
 ```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg \
   --dearmor
```
```bash
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] http://repo.mongodb.org/apt/debian bookworm/mongodb-org/8.0 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
```
```bash
sudo apt-get update
```
```bash
sudo apt-get install -y mongodb-org
```
```bash
mongod --version
```
You can start the **mongod** process by issuing the following command:
```bash
sudo systemctl start mongod
```
---
>>>>>>> origin/master
