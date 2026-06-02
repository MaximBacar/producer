import HeroSection from '@/components/hero-section'
import Features from '@/components/features-1'
import CallToAction from '@/components/call-to-action'
import FooterSection from '@/components/footer'

export default function Page() {
    return (
        <main>
            <HeroSection />
            <section id="features">
                <Features />
            </section>
            <CallToAction />
            <FooterSection />
        </main>
    )
}
