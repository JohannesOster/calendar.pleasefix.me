# calendar.pleasefix.me

Automatically synchronise all your Google and Outlook Calendars.

## Getting started in development

In order to run calendar.pleasefix.me locally you need to have the latest stable version of [NodeJS](https://nodejs.org/en/download) installed.

#### Dependencies

Once you've cloned this repository run `npm install` or `yarn install` to install all dependencies.

#### Redis

We use [BullMQ](https://docs.bullmq.io/) to manage our synchronization tasks queue. BullMQ is built on top of Redis.
Make sure you have a Redis instance running on http://localhost:6379

_Note:_ You can also change the port / host in the [config file](./src/lib/config.ts).

#### Database

The system is built on top of [Prisma](https://www.prisma.io/) as an ORM. For simplicity we just use sqlite3 as a database engine.

Run `npx prisma generate` to generate the [Prisma Client](https://www.prisma.io/docs/orm/prisma-client) and `npx prisma migrate dev` to apply all datatabse [migrations](./prisma/migrations/).

#### Credentials

All necessary credentials / secrets have been added to the [.env.development](.env.development) file and commited to the repository. These is non-confidential and provides access only to dedicated development environments for any third party services (e.g. Google OAuth, Google Calendar API, etc.).

#### Google Cloud Project

While the project isn't published one needs to whitelist google accounts that are allowed to login via OAuth.
You can do that via the [consent-settings](https://console.cloud.google.com/apis/credentials/consent?hl=de&project=calsync-399508) page.
If you don't have access to the google cloud project yet, ask one of the admins to add you via the [iam-admin](https://console.cloud.google.com/iam-admin/iam?hl=de&project=calsync-399508).

## Deployment to production

This repository is currently automatically deployed using GitHub Actions onto a manually set up Ubuntu Server.
