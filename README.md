# myStrom - Smart Home app for Homey

Adds support for [myStrom devices](https://mystrom.ch/smart-home/).

---

## Attention

**Note:**

* **If you have problems after the upgrade, register all devices new.**
* Finding new devices can take up to 4 minutes.
* To add myStrom devices, you have to use the myStrom-App at the moment.

**Important note for Buttons:**

Keep in mind that in order for the Button or Button+ to respond to any of these requests they have to be in the configuration mode:

* Button: (Re-)Connect the button to a power source with the provided USB cable. Press the button and after some time it should become visible in the network.
* Button+: Open the back of the button by rotating it clockwise. Remove the batteries and reinsert them. The Button+ should now be visible.

---

## Devices

* myStrom Switch v1 & v2        
* myStrom Switch Zero           
* myStrom Switch EU             
* myStrom Bulb                  
* myStrom Button                
* myStrom Button Plus           
* myStrom LED Strip             
* myStrom WiFi Motion Sensor    

---

## Changelog

v1.2.5

* Button 'get device-data failed' fixed

v1.2.4

* TempFix debug-log

v1.2.3

* API crash fixed

v1.2.2

* Some internal fixes

v1.2.1

* Device refresh fixed

v1.2.0

* Support HP2023
* Several internal changes

v1.1.5

* myStrom LED Strip added            
* myStrom WiFi Motion Sensor added
* Several internal changes

v1.1.4

* Bugfixes

v1.1.3

* Bugfixes

v1.1.2

* Promises refactored
* myStrom Switch Zero added
* myStrom Switch EU fixed

v1.1.1

* Updated to SDKv3

v1.1.0

* Migrate from homey-wifidriver to axios
* Homey-App Logger removed
* Code refactoring

v1.0.6

* README.txt removed external link

v1.0.5

* Fixed Button
* Add batteries type

v1.0.2

* Some changes for the new Homey-App Store

v1.0.0

* Rewrite myStrom Bulb
* Some fixes

v0.3.0

* Rewrite myStrom Button & Button+ (Due to Homey v2 & myStrom api changes)

v0.2.0

* [Homey-App Logger](https://community.athom.com/t/how-to-integrate-a-homey-app-logger-to-your-app-for-a-simple-global-logger-in-homey) added
* Packages updated
* Homey-Dev added

v0.1.0

* Now uses [semantic versioning](https://semver.org/)

v0.0.5

* Release problem fixed

v0.0.4

* Support for myStrom WiFi Button Plus added
* Code refactored

v0.0.3

* Support for myStrom WiFi Button added
* New pictures added (Thanks to Tom)
* Device response error fixed

v0.0.2

* Support for myStrom WiFi Bulb added
* Device discovery refactored

v0.0.1

* Support for myStrom WiFi Switch added
* initial commit

---

## ToDo

* Add homey discovery-api [see](https://github.com/rkokkelk/com.jreenen.homeyharmonyhub/blob/master/lib/discovery.js)

---

## Copyright

Copyright 2017, 2023 [Chris Gross] cFlat-inc.org
