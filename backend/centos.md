ls -al ~/.ssh

ssh-keygen -t rsa -b 4096 -C "l.rui@student.xu-university.de"

cat ~/.ssh/id_rsa.pub

https://github.com/settings/keys

生成部署 key

systemctl stop mysqld

/etc/my.cnf
[mysqld]
skip-grant-tables

systemctl start mysqld

mysql -u root

use mysql;

flush privileges;

UPDATE mysql.user SET authentication_string = '' WHERE user = 'root';

exit

vi /etc/my.cnf

systemctl restart mysqld

mysql -u root -p

use mysql;

ALTER USER 'root'@'%' IDENTIFIED BY 'jk2026@Berlin';
exit;

ssh -i /Users/lihengrui/software/keys/ubuntu.pem -N -f -L localhost:3307:localhost:3306 root@122.51.48.186
