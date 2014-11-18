#include "mosquitto.h"

#include <stdio.h>
#include <stdlib.h>
#include <getopt.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>
#include <fcntl.h>

#ifdef DEBUG
#define LOG(...) do { printf(__VA_ARGS__); } while(0)
#else
#define LOG(...)
#endif

static bool get_cpu_temp(float *temp)
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
            *temp = strtof(buf, NULL) / 1000;
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

    payloadlen = snprintf(payload, payload_sz, message);
    ret = mosquitto_publish(mosq, NULL, topic, payloadlen, payload, 0, false);

    return ret;
}

int main(int argc, char * const argv[]) {
    char *host = "localhost";
    int port = 1883;
    char *name;
    int keepalive = 60;
    bool clean_session = true;
    struct mosquitto *mosq = NULL;

    int ch;

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

    mosquitto_lib_init();
    mosq = mosquitto_new(name, NULL);
    if(!mosq) {
        fprintf(stderr, "Error: Out of memory.\n");
        exit(EXIT_FAILURE);
    }

    mosquitto_connect(mosq, host, port, keepalive, clean_session);

    float temp;
    while(get_cpu_temp(&temp))
    {
        char str[32];
        sprintf(str, "%g", temp);
        send(mosq, "temperature/cpu", str);
        sleep(1);
    }

    fprintf(stderr, "%s\n", "error get_cpu_temp");

    mosquitto_destroy(mosq);
    mosquitto_lib_cleanup();
    return 0;
}