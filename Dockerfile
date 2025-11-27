FROM ubuntu:latest
LABEL authors="amoss"

ENTRYPOINT ["top", "-b"]