# CBR Simulator
Provides a mechanism for simulating the process of feeding data into OpenMRS instances for purposes of demonstrating case based surveillance.

### Simulator configuration
Locate the config.js file under the config directory at the root of the unzipped folder of the
cbr simulator and set the connection credentials for your OpenMRS instance.

Note that you can specify multiple instances, in the config.js there is some useful documentation
for each field, if multiple OpenMRS instances are defined, the simulator will end up pushing each
event to any random instance.

Below is an example configuration for 3 instances.
```
  var config = {
      openmrsInstances : [
          {
              id: 1,
              name: "Kampala Health Center",
              baseUrl: "http://myIpAddress1:myPort1/openmrs",
              username: 'admin',
              password: 'secret',
              patientIdentifierTypeUuid: 'UUID-1'
          },
          {
              id: 2,
              name: "Indianapolis Health Center",
              baseUrl: "http://myIpAddress2:myPort2/openmrs",
              username: 'admin',
              password: 'secret',
              patientIdentifierTypeUuid: 'UUID-2'
          },
          {
              id: 3,
              name: "Nairobi Health Center",
              baseUrl: "http://myIpAddress3:myPort3/openmrs",
              username: 'admin',
              password: 'secret',
              patientIdentifierTypeUuid: 'UUID-3'
          }
      ]
  }
  ```

### Case reports module configuration
Assuming you have already made all the other configurations for the module for each defined
OpenMRS instance, you need to make the extra configurations below for each instance.

- Go to Home -> Case Reports -> Configure
- Set the value of the 'Enable Cors' field to true and save the changes, this grants the
  simulator access to OpenMRS instances' rest APIs from a browser.
- Make sure the configured patient identifier type does not require a location, to do this you will
  need to navigate to Home -> Configure Metadata -> Manage Patient Identifier Types, select the configured
  identifier type and make sure the location behavior field is set to 'Not Used'.

If you wish to have the generated case reports in the OpenMRS instances to get auto submitted
as the simulator is running, you will need to make sure that the respective scheduled tasks are
started, the value of the 'Auto Submit Provider' field is set and also that the 'Auto Submit'
scheduler task property value(s) are set to true for the corresponding tasks.

It's recommended to always first stop the task if it's already running before editing it otherwise it
will keep overwriting your changes.

For more on these configurations see the module's documentation at
https://docs.google.com/document/d/1tutlA3EZ8X0rqR7Rp1XnPWNFwZY72l1g1CQ_5ZhahyA

### Running the simulator
- There is a config.js file in the config directory that you have to edit to point the simulator to
  the OpenMRS instance(s), you will need to set the URL, username and password.
- Open the index.html file at the root of the unzipped folder in the browser, this can be easily
  achieved by double clicking the file for most operating systems.
- Now you are all set to run the simulator, just click the 'Run' button, you should be able to
  see some logs as the simulator processes the events, it should also be able to report any
  errors it may encounter.
