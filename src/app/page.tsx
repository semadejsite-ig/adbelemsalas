import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 items-center">
        <Image
          src="/LOGO OFICIAL ADBELEMSJC.png"
          alt="ADBelém Logo"
          width={180}
          height={180}
          className="object-contain drop-shadow-lg"
          priority
        />
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">ADBelém Salas</h1>
        <p className="text-lg text-muted-foreground w-full max-w-md">
          Sistema oficial de agendamento de espaços e aviso automático para equipes de apoio.
        </p>

        <div className="flex gap-4 items-center flex-col sm:flex-row mt-4">
          <Button asChild size="lg" className="h-14 px-8 rounded-full">
            <Link href="/dashboard">Acessar Sistema</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-14 px-8 rounded-full">
            <Link href="/registro">Criar uma conta</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
