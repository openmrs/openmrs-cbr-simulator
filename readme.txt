REQUIRED CONFIGURATIONS:
=========================

Simulator configuration
-----------------------
Locate the config.js file under the config directory at the root of the unzipped folder of the
cbr simulator and set the connection credentials for your OpenMRS instance.

Note that you can specify multiple instances, in the config.js there is some useful documentation
for each field, if multiple OpenMRS instances are defined, the simulator will end up pushing each
event to any random instance.

Below is an example configuration for 3 instances.

*****************************  Example  ****************************************
  var config = {
      openmrsInstances : [
          {
              id: 1,
              name: "Kampala Health Center",
              baseUrl: "http://myIpAddress1:myPort1/openmrs",
              username: 'admin'
          },
          {
              id: 2,
              name: "Indianapolis Health Center",
              baseUrl: "http://myIpAddress2:myPort2/openmrs",
              username: 'admin'
          },
          {
              id: 3,
              name: "Nairobi Health Center",
              baseUrl: "http://myIpAddress3:myPort3/openmrs",
              username: 'admin'
          }
      ]
  }
********************************************************************************

Case reports module configuration
---------------------------------
Assuming you have already made all the other configurations for the module for each defined
OpenMRS instance, you need to make the extra configurations below for each instance.

- Go to Home -> Case Reports -> Configure
- Set the value of the 'Enable Cors' field to true and save the changes, this grants the
  simulator access to OpenMRS instances' rest APIs from a browser.
- Make sure no patient identifier type is marked as required otherwise the simulator will fail
  since the it doesn't assign all identifier types to the patients it creates. To do this
  you will need to go to Home -> Configure Metadata -> Manage Patient Identifier Types, edit each
  identifier type and make sure none has the 'Is required' check box checked.

If you wish to have the generated case reports in the OpenMRS instances to get auto submitted
as the simulator is running, you will need to make sure that the respective scheduled tasks are
started, the value of the 'Auto Submit Provider' field is set and also that the 'Auto Submit'
scheduler task property value(s) are set to true for the corresponding tasks, for more on these
configurations see the module's documentation at
https://docs.google.com/document/d/1tutlA3EZ8X0rqR7Rp1XnPWNFwZY72l1g1CQ_5ZhahyA



RUNNING THE SIMULATOR
=====================
- Open the index.htm file at the root of the unzipped folder in the browser, this can be easily
  achieved by double clicking the file for most operating systems.

- The first time you run the simulator, it will prompt you to first to set the password(s) for
  the configured OpenMRS instance(s), after setting the passwords, click the 'Done' button, the
  saved passwords are stored for the duration of the browser session meaning they can be cleared
  whenever you close the window or tab for some browsers, if this happens it wll prompt you again
  for the passwords.

- If you need to change the password(s), click the 'Change Password(s)' button.

- Now you are all set to run the simulator, just click the 'Run' button, you should be able to
  see some logs as the simulator processes the events, it should also be able to report any
  errors it may encounter.