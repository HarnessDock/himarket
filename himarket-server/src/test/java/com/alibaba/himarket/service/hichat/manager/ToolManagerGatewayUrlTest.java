package com.alibaba.himarket.service.hichat.manager;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class ToolManagerGatewayUrlTest {

    @Test
    void replacesOriginKeepsPathAndQuery() {
        assertEquals(
                "http://higress:8080/mcp-servers/lpm-data?a=1",
                ToolManager.toInternalGatewayUrl(
                        "http://101.43.59.3:8082/mcp-servers/lpm-data?a=1",
                        "http://higress:8080/"));
    }

    @Test
    void unchangedWhenNotConfigured() {
        String url = "http://101.43.59.3:8082/mcp-servers/lpm-data";
        assertEquals(url, ToolManager.toInternalGatewayUrl(url, null));
        assertEquals(url, ToolManager.toInternalGatewayUrl(url, ""));
    }
}
