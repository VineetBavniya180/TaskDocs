# **Setting Up a Build Agent**
I create two ec2 instance to setup build agent.

**SSH into the Agent worker node and create the directory for the user's home:**
```
sudo mkdir /var/lib/jenkins
```

**Add the user, assigning the home directory:**
```
sudo useradd -d /var/lib/jenkins jenkins
```
**Make the user the owner of their home directory:**
```
sudo chown -R jenkins:jenkins /var/lib/jenkins
```
**Create an ```.ssh``` directory for the ```jenkins user```:**
```
sudo mkdir /var/lib/jenkins/.ssh
```
**Run ```ssh-keygen```. Hit Enter to accept defaults until it completes.**