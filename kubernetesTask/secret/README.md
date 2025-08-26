# Kubernetes Secret 
In Kubernetes, a Secret is like a ConfigMap, but it’s designed for storing sensitive information such as:
*  Passwords
*  API keys
*  Tokens
*  SSH keys
*  Certificates

## Key Points about Secrets 
* Data is stored in base64-encoded format (not encrypted by default, just encoded). 
* Secrets help avoid hardcoding credentials inside Pod specs or container images. 
* They can be used by Pods as:
    * Environment variables
    * Mounted volumes (as files)
    * Pull secrets for private container registrie