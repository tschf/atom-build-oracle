# Oracle compiler for Atom

Uses the [atom-build](https://atom.io/packages/build) package to execute Oracle compilations in the Atom editor.

This package requires [atom-build](https://atom.io/packages/build) to be installed.

## Installation

First you will want to install the build package `apm install build`. Currently, this package has not been published to Atoms package repository. To install, clone the this repository to your atom package dir (`~/.atom/packages`). The repository name is not a 1-to-1 match to the plugin name, so it needs to be renamed to `build-oracle`. This can be done in the `git clone` command by specifying the distination directory. The output should be similar to:

```bash
$ cd ~/.atom/packages
$ git clone https://github.com/tschf/atom-build-oracle.git build-oracle
Cloning into 'build-oracle'...
remote: Counting objects: 142, done.
remote: Compressing objects: 100% (2/2), done.
remote: Total 142 (delta 8), reused 7 (delta 7), pack-reused 133
Receiving objects: 100% (142/142), 24.07 KiB | 0 bytes/s, done.
Resolving deltas: 100% (67/67), done.
Checking connectivity... done.
```

(Alternatively, you can clone the project elsewhere on the system and use the command `apm link atom-build-oracle`.)

After installation, you should be able to find it listed under community packages in the relevant settings page.

![](https://cloud.githubusercontent.com/assets/1747643/11413140/e4b75b26-9439-11e5-86f5-7bb7dcb19b39.png)

Once installed, you will want to access the settings and set the relevant path for your SQL interpreter. That will be either SQLcl or SQL*Plus. For me, I have `sqlplus` in my `path` so no change is necessary (there is an issue where PATH may not be correctly set in Atom, in that case you should set the full path of `sqlplus`). If I wanted to point it to the binary for `SQLcl`, which isn't in my `path`, I would set the configuration to `/opt/sqlcl/bin/sql`.

![](https://cloud.githubusercontent.com/assets/1747643/11413201/79fcaa10-943a-11e5-881f-1715ef163e29.png)

## Usage instructions

In your project root directory, add a JSON file named `.atom-build-oracle.json`, where you can define build targets for your project. This contents of the file should look like:

```json
[
    {
        "targetName" : "hr: dev",
        "host" : "example.com",
        "sid" : "xe",
        "port" : 1521,
        "user" : "hr",
        "password" : "hr"
    }
]
```

Where you can specify any number of build targets.

Since this file contains sensitive information (password) you will likely also want to add an entry to your `.gitignore` file so this is not published.

```conf
.atom-build-oracle.json
```

It's worth noting, that to get the build system to recognise the above configuration, you will need to reload atom (only the first time). This can be done in the menu `View->Reload` or with the keyboard shortcut `ctrl+alt+r`.

This plugin is an extension to the `build` system, providing the necessary scripts to compile Oracle code. The build triggers are determined as part of the over-arching `build` package. To build the active file is done with the keyboard shortcut `ctrl+alt+b` or `cmd+alt+b` or `f9`. By default, this will be the first entry in your build config file. The active build target can be switched with `f7`, which will also trigger a build on the active file:

![](https://cloud.githubusercontent.com/assets/1747643/15595301/2eeb787e-2401-11e6-9b89-f138d261c122.png)

The build panel (with build output) can be toggled with `f8`.
