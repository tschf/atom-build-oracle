# Experimental functionality

Originally I had implemented a FIFO implementation to use with SQLcl (the Java based SQL interpreter), which was done by enabling the `Run interpreter in background?`, in the package settings (note: this is just for Linux/OSX based systems). I've decided to pull this out and leave it in this exp(erimental) folder so you can use it if you wish, but encourage you to get the package to work with SQL*Plus. Keep in mind, I will not be actively keeping the features in sync for this folder, and may eventually remove this.

See this issue where the original idea was suggested: https://github.com/tschf/atom-build-oracle/issues/2

To use this functionality, you need to edit `package.json`, and set the `main` setting to point at: `exp/make.js`.

Last changes made on 29th July 2016.
