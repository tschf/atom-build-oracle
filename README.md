# Oracle compiler for Atom

Uses the [atom-build](https://atom.io/packages/build) package to execute Oracle compilations in the Atom editor.

This package requires [atom-build](https://atom.io/packages/build) to be installed.

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
