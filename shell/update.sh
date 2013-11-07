#!/bin/bash

git pull
cd application
git pull
cd ..
if [ -d endpoints ];
then
	if [ -L endpoints ];
	then
		echo "endpoints is a symlink nothink to update"
	else
		cd endpoints
		git pull
		cd ..
	fi
fi