# neoan3-cli
neoan3 CLI helper

[![npm version](https://badge.fury.io/js/neoan3-cli.svg)](https://badge.fury.io/js/neoan3-cli)
[![GitHub version](https://badge.fury.io/gh/sroehrl%2Fneoan3-cli.svg)](https://badge.fury.io/gh/sroehrl%2Fneoan3-cli)

## Automate your [neoan3](https://github.com/sroehrl/neoan3) needs

Official neoan3 cli tool for

- application creation
- model creation
- model migration
- model packaging & publishing
- component creation
- component packaging & publishing

### Requires
- node & npm
- composer

### Installation

```  
npm install -g neoan3-cli
```

## Starting a new neoan3 application

1. create a new folder and navigate into it

    e.g. `mkdir myApp`

    `cd myApp`

2. run neoan3 new app command

    e.g. `neoan3 new app myApp`
3. run in your local webserver

### new component
`neoan3 new component [component-name]`

This command will guide you through the creation of a new component, prefilling the controller according to your choices.
- api (generates get & post functions using a particular frame)
- route (generates init-functions resulting in the component acting as a valid route)
- custom element (currently empty class)

### new frame
`neoan3 new frame [frame-name]`

This command generates a new frame.
### new model
`neoan3 new model [model-name]`

This command creates a new model.

## add
`neoan3 add [destination] [package] ([repository-endpoint])`

Adding components makes the following assumptions:
-  the component is registered as a composer-package
-  it is either targeted at being a frame, a model or a component

for all other packages, please use the respective package manager (e.g. composer or npm) or version control system (e.g. GIT).
>neoan3 apps are "regular" composer packages. Please include them using `composer require`

_example_

`neoan3 add frame neoan3-frame/kit`

You can also add the repository-endpoint parameter if you have private repositories or want to work without publishing to packagist.
Please include the full url in these cases.
>_works with bitbucket & github_

_example_

`neoan3 add model custom-model/products https://github.com/yourName/yourPackage.git`

Please not that the name (here: custom-model/products) must be the name of specified in your composer.json of the neoan3-entity.
See [publish](#publish).

## migrate

Currently supports SQL only. 

`neoan3 migrate models [direction]` 

_Credentials_: 
The tool will memorize your credentials (including your password, if confirmed by the user).
When switching between multiple projects or databases, you may want to flush these credentials.
The tool will suggest you to do so if a connection cannot be established, but **you** have to understand the implications
of working with potentially wrong but valid credentials. Therefore, when working with multiple databases or projects,
the command `neoan3 migrate flush` is recommended.

When working with version control branches, the following workflow is recommended:

- before checking out a different branch, _migrate down_ and commit
- after checking out a branch, _migrate up_ 

The migration is highly simplified and works in two directions.
### config
`neoan3 migrate config`

Displays current local database settings. If no settings are present, the creation process starts.

### migrate down

`neoan3 migrate models down`

This generates migrate.jsons from the connected database structure. The following assumptions are made:

Tables starting with a particular model-name are associated with that model. Example: If a model "user" exists tables starting with "user" are considered.
This would include table-names like "user", "user_password" or "userEmail". 
The recommended way for neoan3 is to follow a snake_case naming for tables and columns.

### migrate up

`neoan3 migrate models up`

This creates or alters tables in your connected database based on structural declarations present in your migrate.json files in the folder of models.
It is important to know that removing a column in your declaration will NOT remove the column from the database, while adding a column will generate the column in your database.

## publish

`publish [entity-type] [entity-name]`

_example_

`publish model user`

The publish-command transform a local neoan3 entity into a composer package. Dependencies are taken care of automatically.
The command will also ask you whether you directly want to publish on github. To do so, please ensure:

- you have git installed
- you have registered you identity (config)
- you have a valid token for the intended username
- created a remote repository (e.g. via github.com)

Please refer to Git documentation in order to achieve the above.

Since you have a valid composer.json in your repository now, you may publish on packagist as well.

# Reporting issues

The GitHub repo [neoan3-cli](https://github.com/sroehrl/neoan3-cli) is actively maintained. Please report issues there.

# Collaborators wanted
As of July 2019, over 1500 neoan3 applications are waiting for documentation. I'd love to have some people to help me:

- document neoan3 (framework)
- document neoan3-cli
- document various neoan3 composer apps
- create tutorials

If you are interested, please fel free to get in touch @ https://github.com/sroehrl
