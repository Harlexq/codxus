import { ApiProperty } from '@nestjs/swagger';

/**
 * Kayit yaniti.
 *
 * Bilerek hicbir kullanici bilgisi icermiyor: e-posta yeni de olsa zaten
 * kayitli da olsa TAM OLARAK ayni govde donuyor. Yanittaki en ufak fark
 * (alan, uzunluk, sira) user enumeration icin oracle olurdu.
 */
export class RegisterResponseDto {
  @ApiProperty({
    example: true,
    description:
      'Her zaman true. Kullaniciya "e-postani kontrol et" ekrani gosterilir.',
  })
  verificationPending!: boolean;
}
