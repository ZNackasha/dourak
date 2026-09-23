# Optimized Keycloak image: build-time options are baked in once, so each start
# skips the re-augmentation step that would otherwise run on the tiny VM.
FROM quay.io/keycloak/keycloak:26.7.4 AS builder

ENV KC_DB=postgres
ENV KC_HEALTH_ENABLED=true
ENV KC_HTTP_RELATIVE_PATH=/

RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:26.7.4
COPY --from=builder /opt/keycloak/ /opt/keycloak/
COPY realms/ /opt/keycloak/data/import/

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--optimized", "--import-realm"]
