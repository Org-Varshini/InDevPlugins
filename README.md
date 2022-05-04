### **Create Self-Signed Certificate** :lock:

1. Create the ssl folder, `mkdir ssl`.
2. `cd ssl` and run the following commands:
   - `openssl genrsa -out key.pem`
   - `openssl req -new -key key.pem -out csr.pem`
   - `openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out cert.pem` (We may enter the Country, Organization, Email and skip all other input parameters)

### **Allowing self-signed certificates for localhost in Chrome** :warning:

1. Open `chrome://flags`
2. Enable this flag: `Allow invalid certificates for resources loaded from localhost.`
3. Restart Chrome

### **Running the application** :rocket:

1. For installing the dependencies, run `npm install`
2. To build and start the application, run `npm start`
