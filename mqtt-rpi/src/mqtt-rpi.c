#include <stdio.h>
#include <stdlib.h>
#include <getopt.h>

#include "mosquitto.h"

#ifdef DEBUG
#define LOG(...) do { printf(__VA_ARGS__); } while(0)
#else
#define LOG(...)
#endif

//static bool connect(struct mosquitto *m);
//static void die(const char *msg);


int main(int argc, char * const argv[]) {
    char *host = "localhost";
    int port = 1883;
    int keepalive = 60;
    bool clean_session = true;
    struct mosquitto *mosq = NULL;

    char ch;

    static struct option long_options[] = {
        {"host", required_argument, NULL, 'h'},
        {"port", required_argument, NULL, 'p'}//,
        //{NULL, 0, NULL, 0}
    };

    optind = 1;

    while((ch = getopt_long(argc, argv, "h:p:", long_options, NULL)) != -1) {
        switch(ch) {
            case 'h':
                host = optarg;
                break;
            case 'p':
                port = atoi(optarg);
                break;
            default: /* '?' */
                fprintf(stderr, "Usage: %s [-h host] [-p port]\n", argv[0]);
                exit(EXIT_FAILURE);
        }
    }

    mosquitto_lib_init();
    mosq = mosquitto_new("raspberry_007", NULL);
    if(!mosq) {
        fprintf(stderr, "Error: Out of memory.\n");
        exit(EXIT_FAILURE);
    }

    mosquitto_connect(mosq, host, port, keepalive, clean_session);

    size_t payload_sz = 32;
    char payload[32];
    size_t payloadlen = 0;

    payloadlen = snprintf(payload, payload_sz, "moep");

    mosquitto_publish(mosq, NULL, "test", payloadlen, payload, 0, false);

    mosquitto_destroy(mosq);
    mosquitto_lib_cleanup();
    return 0;
}