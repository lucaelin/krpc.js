FROM ubuntu:18.04

WORKDIR /usr/src/app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl ca-certificates gnupg git unzip && \
    rm -rf /var/lib/apt/lists/*

# Install Mono
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 \
      --recv-keys 3FA7E0328081BFF6A14DA29AA6A19B38D3D831EF && \
    echo "deb https://download.mono-project.com/repo/ubuntu stable-bionic main" | \
      tee /etc/apt/sources.list.d/mono-official-stable.list && \
    apt-get update && \
    apt-get install -y mono-runtime && \
    rm -rf /var/lib/apt/lists/*

# Download TestServer
ADD https://krpc.s3.amazonaws.com/deploy/master/1293.1/TestServer-0.4.9-45-ge22fdd2.zip .
RUN unzip TestServer-0.4.9-45-ge22fdd2.zip
RUN chmod +x ./TestServer.exe

ENTRYPOINT [ "mono", "TestServer.exe", "--type=websockets","--bind=0.0.0.0", "--rpc-port=50000", "--stream-port=50001" ]
