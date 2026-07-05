# LT Portal - Comprehensive Deployment Guide

This guide covers deployment instructions for both the **Node.js (React/Express/Vite)** application and the **PHP (SQLite/MySQL)** application on various hosting environments, including a step-by-step instruction set for **cPanel Shared Hosting**.

---

## Part 1: Deploying the PHP Version on cPanel (Recommended for Shared Hosting)

The PHP version of **LT Portal** is located in the `/php-version` folder of this project. It is specifically designed to run on light, standard shared hosting environments with zero custom container or Node.js server dependencies.

### Step 1: Export/Download the PHP Files
Download the contents of the `/php-version` directory from this workspace:
- `db.php` (Database connection and bootstrap script)
- `index.php` (Login page)
- `dashboard.php` (Full interactive CRUD dashboard & jQuery filtering)
- `backup.php` (Data export script to generate .csv files)
- `logout.php` (Destroys active sessions)

### Step 2: Upload Files to cPanel
1. Log in to your **cPanel Dashboard**.
2. Locate the **Files** section and open the **File Manager**.
3. Navigate to your target directory:
   - For your primary domain: Go to the `public_html` directory.
   - For subdomains (e.g., `registry.yourdomain.com`): Go to the directory assigned to that subdomain.
4. Click **Upload** and upload the five files listed above.

### Step 3: Database Setup (Choose Option A or Option B)

#### Option A: SQLite (Extremely simple, Plug-and-Play)
SQLite is enabled by default. You do not need to create MySQL databases or configure users.
1. Simply upload the files.
2. Visit the website in your browser.
3. The script will automatically create `lt_database.sqlite` in the folder and secure it.
4. **Important Security Tip:** To prevent direct browser downloads of the SQLite database, you can add this block to your `.htaccess` file in the same directory:
   ```apache
   <Files "lt_database.sqlite">
       Order Allow,Deny
       Deny from all
   </Files>
   ```

#### Option B: MySQL (cPanel phpMyAdmin)
If your IT guidelines require a MySQL / phpMyAdmin relational database, follow these steps:
1. In cPanel, find **MySQL Database Wizard** or **MySQL Databases**.
2. Create a new database (e.g., `youruser_lt_portal`).
3. Create a database user and assign a strong password.
4. Add the user to the database, granting **All Privileges**.
5. Open `db.php` using the cPanel File Editor and modify the variables at the top of the file:
   ```php
   $DB_TYPE = 'mysql'; // Change this from 'sqlite' to 'mysql'
   
   // MySQL configuration details:
   $DB_HOST = 'localhost'; // Usually 'localhost' on cPanel
   $DB_NAME = 'youruser_lt_portal'; // Your database name
   $DB_USER = 'youruser_db_username'; // Your database user
   $DB_PASS = 'your_strong_password'; // Your database password
   ```
6. Save the file. When you visit `index.php` in your browser for the first time, the tables will automatically bootstrap and seed themselves!

### Step 4: Login & Default Credentials
Once uploaded and database is configured:
1. Visit `http://yourdomain.com/` (or the folder URL).
2. Use the default administrative credentials:
   - **Username:** `admin`
   - **Password:** `admin123`
3. After logging in, navigate to **Users** (පරිශීලකයන්) to create custom accounts or change passwords for safety.

---

## Part 2: Deploying the Node.js (React/Express/Vite) Version

The primary version of LT Portal is built using React on the frontend and Express.js on the backend.

### Option A: VPS or Node.js hosting (e.g., Heroku, Render, DigitalOcean, cPanel Node.js Selector)
If your cPanel provider has the **Setup Node.js App** feature (using Phusion Passenger), follow these steps:

1. **Build the Application Locally/Workspace:**
   Run the build script to compile Vite assets and bundle the Express server:
   ```bash
   npm run build
   ```
   This compiles everything and produces:
   - `/dist` (Frontend static client files)
   - `/dist/server.cjs` (Bundled, self-contained server script ready for Node execution)

2. **Compress and Upload:**
   Zip the following folders/files and upload them to your Node directory in cPanel:
   - `dist/` (Includes both public folder and server bundle)
   - `package.json`
   - `db_store.json` (This acts as the local JSON database)

3. **Configure cPanel Node App Selector:**
   - Go to **Setup Node.js App** in cPanel.
   - Click **Create Application**.
   - Select the **Node.js Version** (v18 or higher recommended).
   - Set **Application Startup File** to: `dist/server.cjs`.
   - Set **Application Entry point** to: `dist/server.cjs`.
   - Click **Create**, then **Run JS Build / npm install** using the virtual environment command provided in the UI.

4. **Add Environment Variables:**
   Add any custom variables under the **Environment variables** section inside the cPanel Node configuration panel if necessary.

---

## Part 3: Troubleshooting & Permissions
- **PHP Write Permissions:** Ensure the directory containing the PHP files has write permissions (`0755`) so SQLite can create and write to the database file.
- **PHP Extensions:** Ensure that the `PDO` and `pdo_sqlite` / `pdo_mysql` PHP extensions are enabled (these are typically enabled by default on standard cPanel configurations). You can enable them under **Select PHP Version** -> **Extensions** in cPanel.
- **Timezone Adjustment:** The timezone is currently configured to `Asia/Colombo`. If you need to change it, update `date_default_timezone_set('Asia/Colombo');` at the top of the scripts or modify the default PHP INI timezone value in cPanel.
