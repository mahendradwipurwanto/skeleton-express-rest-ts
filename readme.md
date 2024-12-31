# Tech Stack
- Typescript
- Express JS
- MySQL
- TypeORM

# How to Run
## Prerequisites
### Install node & npm on locally.
[Tutorial](https://www.partitionwizard.com/partitionmanager/install-npm-node-js.html)
### Install a Code Editor.
- [Visual Studio Code](https://code.visualstudio.com/)
- [IntelliJ IDEA](https://www.jetbrains.com/idea/)
- [Brackets](https://brackets.io/)
- etc.

## Clone This Repository
### Run this command to clone this project.
```sh
git clone https://github.com/mahendradwipurwanto/skeleton-express-rest-ts.git
```
### Open the project.
```sh
cd skeleton-express-rest-ts && code .
```
### Run npm installer.
```sh
npm install
```

## Run Migrations
### Create new database on your Postgres.
```sh
CREATE DATABASE restapi;
```
### Clone file env.
```sh
cp .env.example .env
```
### Replace and adjust the contents of the .env file.
> [!NOTE]
> The JWT token is using RSA with sha-256 signature, so please provide the private key and public key. You can generate it on [Crypto Tools](https://cryptotools.net/rsagen). And don't forget to encode it to base64, you can encode it on [Base64 Encode](https://www.base64encode.org/) before insert the env value.

### Compile and build ts to js.
```sh
npm run tsc
```
### Run migrations.
```sh
npm run migrate
```

## Run application.
To run the application, you can use command:
```sh
npm run start
```

if you want to use development mode, you can use command:
```sh
npm run start:dev
```

# Thank you.