#!/bin/bash
docker run -p  6389:6379 -v /tmp/data:/data redislabs/redisearch:latest 