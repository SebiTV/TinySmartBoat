import json
import time
import tkinter as tk

message = {}
message["msgtime"] = int(time.time()) * 1000
message["s1"] = False
message["s1set"] = 0
message["s1sot"] = 0
message["voltage"] = 13.4
message["wd1"] = False
man_on = False
with open('utils\data.txt', 'r') as file:
            # Read the contents of the file
            file_content = file.read()
            message = json.loads(file_content)

def button1_clicked():
    with open('utils\data.txt', 'r') as file:
            # Read the contents of the file
            file_content = file.read()
            message = json.loads(file_content)
    print(message)
    if(message["s1"]):
        message["s1"] = False
    else:
        message["s1"] = True
        message["s1sot"] = 0

    with open('utils\data.txt', 'w') as file:
            # Read the contents of the file
            file.write(json.dumps(message))
    print("Button 1 clicked")

def button2_clicked():
    with open('utils\data.txt', 'r') as file:
            # Read the contents of the file
            file_content = file.read()
            message = json.loads(file_content)
    if(message["wd1"]):
        message["wd1"] = False
    else:
           message["wd1"] = True

    with open('utils\data.txt', 'w') as file:
            # Read the contents of the file
            file.write(json.dumps(message))
    print("Button 2 clicked")

# Create the main window
window = tk.Tk()

# Create the first button
button1 = tk.Button(window, text="Manuelles An/Ausschalten", command=button1_clicked)
button1.pack()

# Create the second button
button2 = tk.Button(window, text="Wasser im Schiff", command=button2_clicked)
button2.pack()

# Run the main event loop
window.mainloop()
