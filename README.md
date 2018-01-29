# Tetration Application Dependency Diagram

## Ubuntu installation guide ( tested on Ubuntu 16.10)
```
# remove 4.x nodejs if installed 
$ sudo apt remove nodejs 
$ curl -sL https://deb.nodesource.com/setup_6.x -o nodesource_setup.sh
$ sudo bash nodesource_setup.sh
$ sudo apt-get install nodejs build-essential

# clone repository 
$ git clone https://github.com/CiscoKorea/tetration-app-diagram
$ cd tetration-app-diagram 
$ npm install 
```
## CentOS installation guide ( tested on CentOS 7.x) 
```
#remove 4.x nodejs if installed
$ yum erase nodejs or yum erase node 
$ curl --silent --location https://rpm.nodesource.com/setup_6.x | sudo bash - 
$ sudo yum -y install nodejs 
$ sudo yum -y install gcc-c++ make (if development environment required) 

# clone repository 
$ git clone https://github.com/CiscoKorea/tetration-app-diagram
$ cd tetration-app-diagram 
$ npm install 
```

## Windows installation guide ( tested on Windows 10 Desktop) 
```
install nodejs (8.x LTS version) from nodejs.org 

# clone or download repository 
$ git clone https://github.com/CiscoKorea/tetration-app-diagram
$ cd tetration-app-diagram 
$ npm install 
```
## MacOS installation guide ( tested on MacOS Sierra ) 
```
install nodejs(8.x) from HomeBrew 

#For HomeBrew installation ( https://brew.sh ) 
$ /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"

# clone or download repository 
$ git clone https://github.com/CiscoKorea/tetration-app-diagram
$ cd tetration-app-diagram 
$ npm install 
```

## Option 1 (online usage): modify credentials.js 
update routes/credentials.js with your tetration cluster and api_key, api_secret 


## Option 2 (offline usage) : download your application data from your tetration cluster 
update api_cred.json with your tetration cluster's api_key and api_secret
update app_dump.py with your tetration cluster's end_point information 
```
$ python app_dump.py 
$ cd public/data 
check all.json & {app_id}.json files & folders 
```

## just run & try to use it 
```
$ cd tetration-app-diagram 
$ npm start

```
Open your brower and connect server( or localhost) with 3003 port 

## change service port from 3003 
```
$ export PORT={port_number} 
$ npm start 
or 
$ vi bin/www and update line 15 
var port = normalizePort(process.env.PORT || '3003');
```

After selection application the you can see Application topology diagram with D3 javascript library 


	

