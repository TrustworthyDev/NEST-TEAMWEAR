# Migrations

Migrations change the database schema in production in a reversible and controlled way.

TypeOrm generates and applies migrations. It can even generate them automatically. Read the TypeOrm documentation before this.

## The TypeOrm CLI

The TypeOrm CLI only runs migrations as JavaScript files. This project has been set up to run the CLI through ts-node with a package.json script.

```console
npm run typeorm
```

This means that typeorm options prefixed with `-` need to be specified after a `--`

```console
npm run typeorm migration:run -- -d ./src/dataSource.ts
```

This is the general way to run the TypeOrm CLI. There are more specific scripts available in package.json that require less typing.

## Generate

Entity definitions give TypeOrm the information it needs to build a database schema. If a database is already present, TypeOrm can detect changes between entities and the existing schema and generate a migration file that contains instructions to update the schema as described by the entities.

To generate a migration file from the current state of the configured database to the new state of the entities, run

```console
npm run migration:generate --name=MigrationName
```

where `MigrationName` is the name of the generated migration

## Create

Create an empty migration, write statements manually

```console
npm run migration:create --name=MigrationName
```

## Run

Run all migration files that haven't been run for the configured data source.

```console
npm run migration:run
```

To make sure it runs migrations only once, TypeOrm saves runs in a database table. Run applies all migrations that are not saved in the database yet, and then records their execution.

If the database schema was already updated through other means, the run command can be provided with the `--fake` option. This option saves runs for all migrations, without actually executing any.

```console
npm run migration:run -- --fake
```

## Revert

Finds the latest executed migration from the database, executes its down method and deletes its run from the database. The latest migration is not determined from the timestamp. Although migrations are usually run in the order determined by their timestamps, these are creation times for the files and do not indicate execution time.

```console
npm run migration:revert
```

Revert can be run with `--fake` to delete a run from the database without executing the schema changes. This is most useful to delete a run for a migration that was run with `--fake`.

```console
npm run migration:revert -- --fake
```

In order to revert a migration, the original TypeScript file must be present.

## How to make schema changes

1. In development, activate schema sync
2. Change entities and try them out
3. When satisfied with changed entities, stash and revert changes with git
4. Revert development database schema with sync (start app once)
5. Re-apply entity changes
6. Generate migration
7. Commit changes and migration. Make sure you don't commit sync activation
8. In production, pull changes
9. Run migrations
