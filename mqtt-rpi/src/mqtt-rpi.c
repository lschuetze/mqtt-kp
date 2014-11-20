#include "mosquitto.h"

#include <jansson.h>

#include <stdio.h>
#include <stdlib.h>
#include <getopt.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <sys/time.h>
#include <unistd.h>
#include <fcntl.h>
#include <signal.h>
#include <string.h>

#define CMD_NONE 0
#define CMD_PULL 1
#define CMD_PUSH 2

bool volatile keep_running = true;
int volatile next_cmd = CMD_NONE;
struct timeval tv_until;

static bool get_cpu_temp(int *temp)
{
    int fd;
    char buf[128];
    size_t nbytes;
    ssize_t bytes_read;

    if((fd = open("/sys/class/thermal/thermal_zone0/temp", O_RDONLY, S_IRUSR)) == -1)
        return false;

    while((bytes_read = read(fd, buf, nbytes)) != 1)
    {
        if(bytes_read > 0)
        {
            *temp = strtol(buf, NULL, 10) / 1000;
        }
        break;
    }
    return (close(fd) == 0) ? true : false;
}

static bool send(struct mosquitto *mosq, char *topic, char *message)
{
    size_t payload_sz = 128;
    char payload[128];
    size_t payloadlen = 0;
    bool ret = false;

    payloadlen = snprintf(payload, payload_sz, "%s", message);
    ret = mosquitto_publish(mosq, NULL, topic, payloadlen, payload, 0, false);

    return ret;
}

void trap_handler(int sig) {
    keep_running = false;

    fprintf(stderr, "Shutting down gracefully ...\n");
}

/* Callback that is called when a message arrives from the broker */
void on_message(void *obj, const struct mosquitto_message *message) {
    if(strncmp(message->topic, "control", 7) == 0) {
        char payload[80];
        char delim[] = ";";
        int time;
        
        strncpy(payload, message->payload, message->payloadlen);
        char *ch = strtok(payload, delim);
        
        if(strncmp(ch, "push", 4) == 0) {
            next_cmd = CMD_PUSH;
            ch = strtok(NULL, delim);
            time = strtol(ch, NULL, 10);
            gettimeofday(&tv_until, NULL);
            tv_until.tv_sec += time;
        } else if(strncmp(ch, "pull", 4) == 0) {
            next_cmd = CMD_PULL;
        }
    }
}

unsigned long long milliseconds_since_epoche(struct timeval *tv) {
    return (unsigned long long)(tv->tv_sec) * 1000 + (unsigned long long)(tv->tv_usec) / 1000;
}

int main(int argc, char * const argv[]) {
    char *host = "localhost";
    int port = 1883;
    char *name = "pi";
    int keepalive = 60;
    bool clean_session = true;
    struct mosquitto *mosq = NULL;
    int ch;

    signal(SIGINT, trap_handler);
    signal(SIGQUIT, trap_handler);

    static struct option long_options[] = {
        {"host", required_argument, NULL, 'h'},
        {"port", required_argument, NULL, 'p'},
        {"name", required_argument, NULL, 'n'},
        {NULL, 0, NULL, 0}
    };

    optind = 1;

    while((ch = getopt_long(argc, argv, "h:p:n:", long_options, NULL)) != -1) {
        switch(ch) {
            case 'h':
                host = optarg;
                break;
            case 'p':
                port = atoi(optarg);
                break;
            case 'n':
                name = optarg;
                break;
            default:
                fprintf(stderr, "Usage: %s [-h host] [-p port] [-n name]\n", argv[0]);
                exit(EXIT_FAILURE);
        }
    }

    gettimeofday(&tv_until, NULL);

    mosquitto_lib_init();

    if((mosq = mosquitto_new(name, NULL)) == NULL) {
        fprintf(stderr, "Error: Out of memory.\n");
        exit(EXIT_FAILURE);
    }

    mosquitto_message_callback_set(mosq, on_message);
    mosquitto_connect(mosq, host, port, keepalive, clean_session);

    mosquitto_subscribe(mosq, NULL, "control", 0);

    int temp;
    struct timeval cur;

    while(keep_running) {
        keep_running = (mosquitto_loop(mosq, -1) == MOSQ_ERR_SUCCESS);
        if(next_cmd != CMD_NONE) {
            gettimeofday(&cur, NULL);
            if(next_cmd == CMD_PULL)
                next_cmd = CMD_NONE;
            else {
                if(milliseconds_since_epoche(&cur) >= milliseconds_since_epoche(&tv_until))
                    next_cmd = CMD_NONE;
            }
            get_cpu_temp(&temp);
            char str[32];
            sprintf(str, "%llu;%i", milliseconds_since_epoche(&cur), temp);
            send(mosq, "temperature/cpu", str);
        }
    }
    fprintf(stderr, "End loop. Shutting down.\n");
    mosquitto_disconnect(mosq);
    mosquitto_destroy(mosq);
    mosquitto_lib_cleanup();
    return 0;
}