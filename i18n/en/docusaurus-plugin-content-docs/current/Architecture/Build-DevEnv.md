---
sidebar_position: 2
---

# How to build moorestech development environment.

This tutorial will tell you how to build moorestech development environment.

＊This tutorial is intended for windows.

# Required Environment

- Windows10 or 11
- [Git for windows](https://gitforwindows.org/)
- [unity(2021.2.17f1)](https://unity3d.com/get-unity/download/archive)
- IDE available for unity

# Clone the repository from Github
https://github.com/moorestech/moorestech_client

Execute the following command in the directory where you want to download moorestech.

`git clone https://github.com/moorestech/moorestech_client`

The process should be quick.

# Excute submodule update
Since moorestech uses git submodule, it is necessary to do a submodule update. Now, run the following command in the repository you just downloaded.

`git submodule update --init`

# Open the project with unity
unity hubにて、`project -> pull down -> add project from disk, and chose the ditectory`

# The end
This concludes this tutorial. Have a nice day!
