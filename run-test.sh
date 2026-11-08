#!/bin/bash
source test-env.sh
./gradlew bootRun --args='--spring.profiles.active=test'
