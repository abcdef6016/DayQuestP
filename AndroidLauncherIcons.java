import java.awt.AlphaComposite;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import javax.imageio.ImageIO;

class AndroidLauncherIcons {
    private static final Path RES = Path.of("android", "app", "src", "main", "res");

    public static void main(String[] args) throws IOException {
        if (!Files.isDirectory(RES)) {
            throw new IOException("Run Capacitor Android sync before creating launcher icons.");
        }
        BufferedImage artwork = ImageIO.read(Path.of("icon.png").toFile());
        if (artwork == null) throw new IOException("Could not read DayQuest icon.png.");

        String[] densities = {"mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"};
        int[] sizes = {48, 72, 96, 144, 192};
        for (int i = 0; i < densities.length; i++) {
            BufferedImage icon = center(artwork, sizes[i], 1.0);
            Path mipmap = RES.resolve("mipmap-" + densities[i]);
            writeIcon(icon, mipmap.resolve("ic_launcher.png"));
            writeIcon(icon, mipmap.resolve("ic_launcher_round.png"));
        }

        // Keep the badge inside the adaptive icon's central safe area.
        writeIcon(center(artwork, 432, 0.60), RES.resolve("drawable-nodpi/dayquest_launcher_foreground.png"));
        writeText(RES.resolve("values/dayquest_launcher_colors.xml"), """
            <?xml version="1.0" encoding="utf-8"?>
            <resources>
                <color name="dayquest_launcher_background">#231642</color>
            </resources>
            """);
        String adaptive = """
            <?xml version="1.0" encoding="utf-8"?>
            <adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
                <background android:drawable="@color/dayquest_launcher_background" />
                <foreground android:drawable="@drawable/dayquest_launcher_foreground" />
            </adaptive-icon>
            """;
        writeText(RES.resolve("mipmap-anydpi-v26/ic_launcher.xml"), adaptive);
        writeText(RES.resolve("mipmap-anydpi-v26/ic_launcher_round.xml"), adaptive);
        System.out.println("Installed DayQuest adaptive and legacy Android launcher icons.");
    }

    private static BufferedImage center(BufferedImage artwork, int size, double coverage) {
        BufferedImage icon = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
        Graphics2D graphics = icon.createGraphics();
        try {
            int drawSize = (int) Math.round(size * coverage);
            int offset = (size - drawSize) / 2;
            graphics.setComposite(AlphaComposite.Src);
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            graphics.drawImage(artwork, offset, offset, drawSize, drawSize, null);
        } finally {
            graphics.dispose();
        }
        return icon;
    }

    private static void writeIcon(BufferedImage image, Path path) throws IOException {
        Files.createDirectories(path.getParent());
        if (!ImageIO.write(image, "png", path.toFile())) throw new IOException("No PNG image writer found.");
    }

    private static void writeText(Path path, String text) throws IOException {
        Files.createDirectories(path.getParent());
        Files.writeString(path, text);
    }
}
