package com.asgaj.bowl_builder.realtime;

import com.asgaj.bowl_builder.auth.JwtService;
import io.jsonwebtoken.Claims;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Authenticates STOMP clients with the JWT sent in the CONNECT frame, and decides what each
 * client may subscribe to. Clients are listen-only: they can never send messages.
 */
@Component
public class StompAuthInterceptor implements ChannelInterceptor {

    private static final String KITCHEN = "/topic/kitchen";
    private static final String MY_ORDERS = "/user/queue/orders";

    private final JwtService jwtService;

    public StompAuthInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        switch (accessor.getCommand()) {
            case CONNECT -> {
                String header = accessor.getFirstNativeHeader("Authorization");
                Claims claims = (header != null && header.startsWith("Bearer "))
                        ? jwtService.parse(header.substring(7)) : null;
                if (claims == null) {
                    throw new MessagingException("Authentication required");
                }
                String role = claims.get("role", String.class);
                accessor.setUser(new UsernamePasswordAuthenticationToken(
                        claims.getSubject(), null, List.of(new SimpleGrantedAuthority("ROLE_" + role))));
            }
            case SUBSCRIBE -> {
                String destination = accessor.getDestination();
                if (!(accessor.getUser() instanceof Authentication user) || destination == null) {
                    throw new MessagingException("Authentication required");
                }
                if (KITCHEN.equals(destination)) {
                    boolean staff = user.getAuthorities().stream().anyMatch(a ->
                            a.getAuthority().equals("ROLE_STAFF") || a.getAuthority().equals("ROLE_ADMIN"));
                    if (!staff) {
                        throw new MessagingException("Staff only");
                    }
                } else if (!MY_ORDERS.equals(destination)) {
                    throw new MessagingException("Unknown destination");
                }
            }
            case SEND -> throw new MessagingException("Clients cannot send messages");
            default -> {
            }
        }
        return message;
    }
}