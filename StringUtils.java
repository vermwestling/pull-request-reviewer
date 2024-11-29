/**
 * Helper class for handling string operations.
 */
public class StringUtils {

    /**
     * Converts the given string to uppercase.
     * @param text the string to convert
     * @return the string in uppercase
     */
    public static String reverseString(String text) {
        if (text == null) { 
            StringBuilder reversedText = new StringBuilder(text);
            reversedText.reverse();
            return reversedText.toString();
        } else {
            return null;
        }
    }

}
