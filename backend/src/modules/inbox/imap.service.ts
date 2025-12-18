import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';

interface FetchedEmail {
  messageId: string;
  subject: string;
  from: string;
  body: string;
  htmlBody?: string;
  receivedAt: Date;
}

@Injectable()
export class ImapService {
  private readonly logger = new Logger(ImapService.name);
  private readonly imapHost: string;
  private readonly imapPort: number;
  private readonly imapTls: boolean;

  constructor(private configService: ConfigService) {
    this.imapHost = configService.get<string>('IMAP_HOST') || 'srv.uzmanumre.com';
    this.imapPort = parseInt(configService.get<string>('IMAP_PORT') || '993');
    this.imapTls = configService.get<string>('IMAP_SECURE') !== 'false';
  }

  /**
   * Fetch emails from inbox
   */
  async fetchEmails(
    email: string,
    password: string,
    options: { unseen?: boolean; limit?: number } = {},
  ): Promise<FetchedEmail[]> {
    const { unseen = false, limit = 50 } = options;

    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: email,
        password,
        host: this.imapHost,
        port: this.imapPort,
        tls: this.imapTls,
        tlsOptions: { rejectUnauthorized: false },
      });

      const emails: FetchedEmail[] = [];

      imap.once('ready', () => {
        imap.openBox('INBOX', true, (err, box) => {
          if (err) {
            imap.end();
            return reject(err);
          }

          const searchCriteria = unseen ? ['UNSEEN'] : ['ALL'];

          imap.search(searchCriteria, (searchErr, results) => {
            if (searchErr) {
              imap.end();
              return reject(searchErr);
            }

            if (!results || results.length === 0) {
              imap.end();
              return resolve([]);
            }

            // Get last N emails
            const toFetch = results.slice(-limit);

            const fetch = imap.fetch(toFetch, {
              bodies: '',
              struct: true,
            });

            fetch.on('message', (msg, seqno) => {
              msg.on('body', (stream, info) => {
                let buffer = '';
                stream.on('data', (chunk) => {
                  buffer += chunk.toString('utf8');
                });

                stream.once('end', async () => {
                  try {
                    const parsed = await simpleParser(buffer);
                    emails.push({
                      messageId: parsed.messageId || `${seqno}`,
                      subject: parsed.subject || '(Konu yok)',
                      from: this.extractFromAddress(parsed),
                      body: parsed.text || '',
                      htmlBody: parsed.html || undefined,
                      receivedAt: parsed.date || new Date(),
                    });
                  } catch (parseErr) {
                    this.logger.error(`Failed to parse email: ${parseErr.message}`);
                  }
                });
              });
            });

            fetch.once('error', (fetchErr) => {
              this.logger.error(`Fetch error: ${fetchErr.message}`);
            });

            fetch.once('end', () => {
              imap.end();
              resolve(emails);
            });
          });
        });
      });

      imap.once('error', (err) => {
        this.logger.error(`IMAP error: ${err.message}`);
        reject(err);
      });

      imap.connect();
    });
  }

  /**
   * Extract verification code from email content
   */
  extractVerificationCode(content: string): { code: string; type: string } | null {
    // Common verification code patterns
    const patterns = [
      // Nusuk specific patterns (6-digit)
      { regex: /verification\s*code[:\s]*(\d{6})/i, type: 'NUSUK' },
      { regex: /doğrulama\s*kodu[:\s]*(\d{6})/i, type: 'NUSUK' },
      { regex: /OTP[:\s]*(\d{6})/i, type: 'NUSUK' },
      { regex: /code[:\s]*(\d{6})/i, type: 'NUSUK' },
      { regex: /kod[:\s]*(\d{6})/i, type: 'NUSUK' },

      // Generic 4-6 digit codes
      { regex: /(\d{4,6})/, type: 'OTHER' },
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern.regex);
      if (match && match[1]) {
        return {
          code: match[1],
          type: pattern.type,
        };
      }
    }

    return null;
  }

  /**
   * Check if email is from Nusuk
   */
  isNusukEmail(from: string, subject: string): boolean {
    const nusukDomains = ['nusuk.sa', 'hajj.gov.sa', 'mofa.gov.sa'];
    const nusukKeywords = ['nusuk', 'umrah', 'hajj', 'verification', 'doğrulama'];

    const fromLower = from.toLowerCase();
    const subjectLower = subject.toLowerCase();

    return (
      nusukDomains.some((domain) => fromLower.includes(domain)) ||
      nusukKeywords.some((keyword) => subjectLower.includes(keyword))
    );
  }

  private extractFromAddress(parsed: ParsedMail): string {
    if (parsed.from?.value?.[0]) {
      const sender = parsed.from.value[0];
      return sender.address || sender.name || 'unknown';
    }
    return 'unknown';
  }
}
