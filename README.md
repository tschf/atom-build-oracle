# Oracle compiler for Atom

[![apm](https://img.shields.io/apm/l/build-oracle.svg?style=flat-square)](https://atom.io/packages/build-oracle)
[![apm](https://img.shields.io/apm/v/build-oracle.svg?style=flat-square)](https://atom.io/packages/build-oracle)
[![apm](https://img.shields.io/apm/dm/build-oracle.svg?style=flat-square)](https://atom.io/packages/build-oracle)

Uses the [atom-build](https://atom.io/packages/build) package to execute Oracle compilations in the Atom editor.

This package requires [atom-build](https://atom.io/packages/build) to be installed.

## Prerequisites

To be able to compile your code, you need either `SQL*Plus` or `SQLcl` available on your system - preferably in your PATH. `SQL*Plus` requires more steps to get set up (such as installing the instant client), but you will get much faster compile times so that is the preferred interpreter (`SQLcl` is Java based, so launching the JVM each time adds to the compile time).

### SQL*Plus set up

#### OS X

You may face issues depending on how you set up the instant client. The [typical guide](https://docs.oracle.com/cd/E11882_01/install.112/e38228/inst_task.htm#BABHEBIG) involves setting an environment variable `DYLD_LIBRARY_PATH`. Unforunately, in OS X El Capitan, this variable is not passed in as an environment variable into Atom (this is a part of security measure known as System Integrity Protection). You can also see that this is not output if you run the `env` command on the terminal.

If you followed those general steps, you will likely be getting this error (or very similar):

```
dyld: Library not loaded: /ade/dosulliv_sqlplus_mac/oracle/sqlplus/lib/libsqlplus.dylib
  Referenced from: /opt/Oracle/instantclient_11_2/sqlplus
  Reason: image not found
Trace/BPT trap: 5
```

Two ways around this.

* In the settings for this plugin, set the path where your client files are (copy what you have for your existing DYLD_LIBRARY_PATH).

![](https://cloud.githubusercontent.com/assets/1747643/17292725/1f61b8a2-582f-11e6-940f-b9c7ae7ff42e.png)

* Or, instead of setting `DYLD_LIBRARY_PATH`, you can make all the libaries available in a location that `SQL*Plus` knows where to look for them. Two common locations are `~/lib` or `/usr/local/lib`. So, assuming you placed the instant client at `/opt/Oracle/instantclient_11_2`, run the following:

```bash
sudo mkdir -p /usr/local/lib
sudo ln -s /opt/Oracle/instantclient_11_2/libclntsh.dylib.11.1 /usr/local/lib/libclntsh.dylib.11.1
sudo ln -s /opt/Oracle/instantclient_11_2/libnnz11.dylib /usr/local/lib/libnnz11.dylib
sudo ln -s /opt/Oracle/instantclient_11_2/libociei.dylib /usr/local/lib/libociei.dylib
sudo ln -s /opt/Oracle/instantclient_11_2/libsqlplus.dylib /usr/local/lib/libsqlplus.dylib
sudo ln -s /opt/Oracle/instantclient_11_2/libsqlplusic.dylib /usr/local/lib/libsqlplusic.dylib
```

Ensure your `PATH` is set up with the instant client directory on it so that `sqlplus` is on it. In your `~/.bash_profile` add the line:

```bash
export PATH=/opt/Oracle/instantclient_11_2:$PATH
```

I went with `/usr/local/lib` rather than `~/lib` so to not fill up my home directory. Aside from that difference, this is much as what is described on the [download page](http://www.oracle.com/technetwork/topics/intel-macsoft-096467.html) of the instant client (down the bottom of the page).

If you previously set up `DYLD_LIBRARY_PATH` you can unset that and you should be good to go.

#### Ubuntu/Linux

To be able to run SQL*Plus from Atom, Atom needs to have all the relevant enviornment variables set up. I followed the installation from this [guide](https://help.ubuntu.com/community/Oracle%20Instant%20Client). The guide mentions to set environment variables in a system wide location or `~/.bash_profile`. The guide suggests to install it in a system wide location since you typically only have one Oracle client installed per system. That is a good approach also for Atom, as it will ensure Atom picks up the relevant environment variables. I found that environment variables set in `~/.bash_profile` are not picked up by the (GUI) terminal, and upon further digging I found that `~/.bash_profile` is only picked up when launching a virtual console - see this [post](http://askubuntu.com/questions/121073/why-bash-profile-is-not-getting-sourced-when-opening-a-terminal). The other location you may be tempted to use is `~/.bashrc`, however this is also not a good place as Atom doesn't seem to pick up the environment set up in there, see this [comment](https://github.com/joefitzgerald/go-plus/issues/386#issuecomment-199359955).

So, to sum it up. Either place your Oracle variables in a script at `/etc/profile.d/oracle.sh` (globally set), or place them in `~/.profile` which will get picked up by Atom.

### SQLcl set up

#### Windows

An issue you may face on Windows is if you try and compile code containing unicode characters, they won't persist when compiling with SQLcl. The reason is that the JVM doesn't default to UTF-8 encoding on Windows.

To get around this, ensure you point to sql.bat (instead of sql.exe) and also that you have checked "Enforce UTF-8" in the package settings, similar to:

![screenshot from 2016-08-28 17-49-57](https://cloud.githubusercontent.com/assets/1747643/18032450/6bcbdfbe-6d48-11e6-87f0-a471ff298301.png)

When `Enforce UTF-8 encoding` is on, the environment variable `JAVA_OPTS` will be set to `-Dfile.encoding=UTF-8`. This is also discussed on Stack overflow: http://stackoverflow.com/questions/361975/setting-the-default-java-character-encoding

## Installation

Install through apm or in Atom itself, where the name of the package is `build-oracle`.

```
apm install build-oracle
```

Once installed, you will want to access the settings and set the relevant path for your SQL interpreter. That will be either SQLcl or SQL*Plus. For me, I have `sqlplus` in my `path` so no change is necessary (there is an issue where PATH may not be correctly set in Atom, in that case you should set the full path of `sqlplus`). If I wanted to point it to the binary for `SQLcl`, which isn't in my `path`, I would set the configuration to `/opt/sqlcl/bin/sql`.

![](https://cloud.githubusercontent.com/assets/1747643/11413201/79fcaa10-943a-11e5-881f-1715ef163e29.png)

## Usage instructions

In your project root directory, add a JSON file named `.atom-build-oracle.json`, where you can define build targets for your project. This contents of the file expects an array of objects, which supports the following parameters:

|Property name  | Description             | Example |
|---            |---                      | ---     |
| targetName    | A descriptive name of the build target. This is so you know to which environment you'll be compiling to.       | hr: dev|
| connectString | The connect string you would used to connect to `sqlplus` on the command line. <br>**note 1:** You *must* specify a password at this stage. <br>**note 2:** `connectString` is the preferred field to use. | - hr/hr@//server:port/sid  <br />- hr/hr@XE1 |
| host | The server of the database       | example.com |
| port | The database port                | 1521 (default) |
| sid  | The database SID or service name | XE |
| user | The schema name you connect to   | hr |
| password | The password of the schema   | oracle |

note: `connectString` is built from the other server details if you ommit that setting.

Examples:

Connect string:

Suppose I have the following TNS entry defined:

```
XE1 =
    (DESCRIPTION =
        (ADDRESS_LIST =
            (ADDRESS = (PROTOCOL = TCP)(HOST = 192.168.56.101)(PORT = 1521))

        )
        (CONNECT_DATA =
            (SERVICE_NAME = XE)
        )
    )
```

My build file becomes:

```json
[
    {
        "targetName" : "hr: dev",
        "connectString" : "hr/hr@XE1"
    }
]
```

Individual details:
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
If your database server uses service names instead of SID, you can enter the service name in the property "sid" nonetheless.

Since this file contains sensitive information (password) you will likely also want to add an entry to your `.gitignore` file so this is not published.

```conf
.atom-build-oracle.json
```

It's worth noting, that to get the build system to recognise the above configuration, you will need to reload atom (only the first time). This can be done in the menu `View->Reload` or with the keyboard shortcut `ctrl+alt+r`.

This plugin is an extension to the `build` system, providing the necessary scripts to compile Oracle code. The build triggers are determined as part of the over-arching `build` package. To build the active file is done with the keyboard shortcut `ctrl+alt+b` or `cmd+alt+b` or `f9`. By default, this will be the first entry in your build config file. The active build target can be switched with `f7`, which will also trigger a build on the active file:

![](https://cloud.githubusercontent.com/assets/1747643/15595301/2eeb787e-2401-11e6-9b89-f138d261c122.png)

The build panel (with build output) can be toggled with `f8`.
