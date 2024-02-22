# python 3.6

import random
import time
import json
from paho.mqtt import client as mqtt_client

message = {}
message["msgtime"] = int(time.time()) * 1000
message["s1"] = False
message["s1set"] = 0
message["s1sot"] = 0
message["voltage"] = 13.4
message["wd1"] = False
man_on = False
broker = '' #Put your Host idress here
port = 1883
topic = "tinysmartboat/schiff1/state"   #Put the right topic here
topic_sub = "tinysmartboat/schiff1/switches"    #Put the right topic here
# Generate a Client ID with the publish prefix.
client_id = f'publish-{random.randint(0, 1000)}'
username = '' #Put your username here
password = '' #Put your password here

def connect_mqtt():
    
    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            print("Connected to MQTT Broker!")
        else:
            print("Failed to connect, return code %d\n", rc)

    client = mqtt_client.Client(client_id)
    client.username_pw_set(username, password)
    client.on_connect = on_connect
    client.connect(broker, port)
    return client
    
    
def publish(client):
    while True:
        time.sleep(5)
        with open('utils\data.txt', 'r') as file:
            # Read the contents of the file
            file_content = file.read()
            message = json.loads(file_content)
        
        message["voltage"] = change_voltage(12,14)
        message["msgtime"] = int(time.time()) * 1000
        if((message["msgtime"] - message["s1set"])/60000 > message["s1sot"] and message["s1sot"]!=0):
            message["s1"] = False
        with open('utils\data.txt', 'w') as file:
            # Read the contents of the file
            file.write(json.dumps(message))
        result = client.publish(topic, json.dumps(message), retain=True)
        status = result[0]
        if status == 0:
            print(f"Send `{message}` to topic `{topic}`")
        else:
            print(f"Failed to send message to topic {topic}")

def change_voltage(bot, top):
    print("Change Voltage")
    return round(random.uniform(bot,top),1)

def run():
   
    client = connect_mqtt()
    client.loop_start()
    subscribe(client)
    publish(client)
    client.loop_stop()

def subscribe(client: mqtt_client):
    def on_message(client, userdata, msg):
        print(f"Received `{msg.payload.decode()}` from `{msg.topic}` topic")
        with open('utils\data.txt', 'r') as file:
            # Read the contents of the file
            file_content = file.read()
            message = json.loads(file_content)
        received_message = json.loads(msg.payload.decode())
        #print(type(received_message))
        if not man_on:
            message["s1sot"] = received_message["s1sot"]
            
        message["s1"] = received_message["s1set"]
        
        message["s1set"] = received_message["s1"]
        with open('utils\data.txt', 'w') as file:
            # Read the contents of the file
            file.write(json.dumps(message))
    


    client.subscribe(topic_sub)
    client.on_message = on_message


if __name__ == '__main__':
    run()
