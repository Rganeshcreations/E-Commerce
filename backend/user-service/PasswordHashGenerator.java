import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.io.Console;

public class PasswordHashGenerator {
    public static void main(String[] args) {
        Console console = System.console();

        if (console == null) {
            System.err.println("Run this from an interactive terminal.");
            System.exit(1);
        }

        char[] passwordChars = console.readPassword("New temporary password: ");
        String password = new String(passwordChars);

        try {
            System.out.println("BCrypt hash:");
            System.out.println(new BCryptPasswordEncoder().encode(password));
        } finally {
            java.util.Arrays.fill(passwordChars, '\0');
        }
    }
}
