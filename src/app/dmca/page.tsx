import React from 'react';

export const metadata = {
  title: 'DMCA Policy - MeowTV',
};

export default function DmcaPage() {
  return (
    <div className="container page-pad">
      <div className="prose">
        <h1 className="section-header">DMCA Policy</h1>

        <section className="section">
          <h2 className="subsection-header">Is MeowTV Legal?</h2>
          <p>
            MeowTV operates in a legal gray area. Copyright laws vary significantly from country to country, and the legality of streaming services can be complex and subject to interpretation.
          </p>
          <p>
            MeowTV does not host any content on our servers. We simply provide links to media hosted on third-party services that are publicly available on the internet.
          </p>
        </section>

        <section className="section">
          <h2 className="subsection-header">Copyright Information</h2>
          <p>
            Copyright laws vary by jurisdiction. In some countries, streaming content may be considered legal for personal use, while in others it may be prohibited.
          </p>
          <p>
            Users should be aware of the copyright laws in their respective countries and use MeowTV at their own discretion and risk.
          </p>
        </section>

        <section className="section">
          <h2 className="subsection-header">DMCA Takedown Requests</h2>
          <p>
            If you believe that your copyrighted work has been copied in a way that constitutes copyright infringement, please submit a notification to our designated Copyright Agent at:
          </p>
          <p>
            <strong>Email:</strong> contact@meowtv.anonaddy.me
          </p>
          <p>
            Please include the following information in your notification:
          </p>
          <ul style={{ listStyle: 'disc', paddingLeft: '20px', marginTop: '10px', color: 'var(--text-secondary)' }}>
            <li>A physical or electronic signature of the copyright owner or a person authorized to act on their behalf</li>
            <li>Identification of the copyrighted work claimed to have been infringed</li>
            <li>Identification of the material that is claimed to be infringing or to be the subject of infringing activity</li>
            <li>Your contact information, including your address, telephone number, and email address</li>
            <li>A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law</li>
            <li>A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the copyright owner</li>
          </ul>
        </section>

        <section className="section">
          <h2 className="subsection-header">Disclaimer</h2>
          <p>
            MeowTV is not responsible for and has no control over the content of any third-party website. We do not host any content and have no control over the nature, content, or availability of those sites.
          </p>
          <p>
            The inclusion of any links does not necessarily imply a recommendation or endorsement of the views expressed within them.
          </p>
        </section>
      </div>
    </div>
  );
}
