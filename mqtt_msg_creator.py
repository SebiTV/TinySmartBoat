#!/usr/bin/env python3

import argparse
import time
import json
import paho.mqtt.client as mqtt

def main(): 
    parser = argparse.ArgumentParser(
        formatter_class=argparse.RawDescriptionHelpFormatter,
        description="send mqtt messages for tinysmartboat testing",
        epilog="(c) 2023 qsol.de",
    )
    parser.add_argument(
        "-i", "--id", help="topic id", default="schiff1"
    )
    parser.add_argument(
        "-u", "--user", help="mqtt user", default="schiff1u"
    )
    parser.add_argument(
        "-p", "--password", help="mqtt password", default="schiff1upw"
    )
    parser.add_argument(
        "--host", help="mqtt host", default="tsbbroker.qsol.de"
    )
    parser.add_argument(
        "--port",
        help="mqtt port",
        default=1883,
    )
    parser.add_argument(
        "--s1",
        help="set switch1",
        default=None,
        choices=['on','off']
    )
    parser.add_argument(
        "--s1sot",
        help="switch1 on time",
        default=60,
        type=int
    )
    parser.add_argument(
        "--s1set",
        help="switch1 set time (seconds since epoch)",
    )
    parser.add_argument(
        "--voltage",
        help="voltage",
        default=13.4,
        type=float
    )
    parser.add_argument(
        "--wd1",
        help="Water Detector 1",
        action="store_true",
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--switches', help="issue a switches topic", action='store_true')
    group.add_argument('--state', help="issue a state topic", action='store_true')
    args = parser.parse_args()

    message = {}
    message["msgtime"] = int(time.time()) * 1000
    if args.s1 is not None:
        if args.s1 == "on":
            message["s1"] = True
        else:
            message["s1"] = False
        if args.s1set is not None:
            message["s1set"] = args.s1set
        else:
            message["s1set"] = message["msgtime"]
        message["s1sot"] = args.s1sot

    if args.switches:
        topic = f"tinysmartboat/{args.id}/switches"

    else:
        topic = f"tinysmartboat/{args.id}/state"
        message["voltage"] = args.voltage
        if args.wd1:
            message["wd1"] = True
        else:
            message["wd1"] = False

    print("Topic:",topic)
    message_string = json.dumps(message)
    print("Message:",message_string)

    # ok, now for the mqtt stuff
    client = mqtt.Client(args.user)
    client.username_pw_set(args.user, args.password)
    client.connect(args.host)
    client.publish(topic, message_string, retain=True)

if __name__ == "__main__":
    main()
