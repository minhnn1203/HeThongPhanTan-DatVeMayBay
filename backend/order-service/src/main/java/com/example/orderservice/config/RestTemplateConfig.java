package com.example.orderservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.net.Proxy;
import java.net.ProxySelector;
import java.net.URI;
import java.time.Duration;
import java.util.List;

@Configuration
public class RestTemplateConfig {

    static {
        ProxySelector defaultSelector = ProxySelector.getDefault();
        ProxySelector.setDefault(new ProxySelector() {
            @Override
            public List<Proxy> select(URI uri) {
                return List.of(Proxy.NO_PROXY);
            }

            @Override
            public void connectFailed(URI uri, java.net.SocketAddress sa, java.io.IOException ioe) {
                if (defaultSelector != null) {
                    defaultSelector.connectFailed(uri, sa, ioe);
                }
            }
        });
    }

    @Bean
    public SimpleClientHttpRequestFactory requestFactory() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(10));
        factory.setReadTimeout(Duration.ofSeconds(10));
        factory.setProxy(Proxy.NO_PROXY);
        return factory;
    }

    @Bean
    public RestTemplate restTemplate(SimpleClientHttpRequestFactory requestFactory) {
        return new RestTemplate(requestFactory);
    }
}