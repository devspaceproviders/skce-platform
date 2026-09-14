import Image from "next/image";

export default function CEOSection() {
  return (
    <section className="w-full bg-white px-4 py-16 sm:px-6 md:py-20">
      <div className="mx-auto w-full max-w-6xl">
        
        {/* Heading */}
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-orange-500">
            Our Leadership
          </p>

          <h2 className="text-3xl font-extrabold text-[#173B67] sm:text-4xl">
            Meet Our Founder & CEO
          </h2>

          <div className="mx-auto mt-4 flex justify-center gap-2">
            <div className="h-1 w-16 rounded-full bg-orange-500" />
            <div className="h-1 w-6 rounded-full bg-[#173B67]" />
          </div>
        </div>

        {/* CEO Content */}
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">

          {/* CEO IMAGE */}
          <div className="flex w-full justify-center">
            <div className="relative w-full max-w-[420px]">

              {/* Keeps the container perfectly square */}
              <div className="aspect-square w-full">

                {/* Orange outer ring */}
                <div className="absolute inset-0 rounded-full border-[10px] border-orange-500" />

                {/* Blue ring */}
                <div className="absolute inset-[12px] rounded-full bg-[#173B67]" />

                {/* White ring */}
                <div className="absolute inset-[20px] rounded-full bg-white" />

                {/* IMAGE */}
                <div className="absolute inset-[27px] overflow-hidden rounded-full">
                  <Image
                    src="/images/ceo.png"
                    alt="C. Neelima - Founder & CEO of SK Computer Education"
                    width={400}
                    height={500}
                    priority
                    className="h-full w-full object-cover object-center"
                  />
                </div>

                {/* Orange decoration */}
                <div className="absolute right-0 top-20 h-9 w-9 rounded-full bg-orange-500 shadow-md sm:h-10 sm:w-10" />

                {/* Blue decoration */}
                <div className="absolute bottom-4 left-10 h-7 w-7 rounded-full bg-[#173B67]" />

              </div>
            </div>
          </div>

          {/* CEO TEXT */}
          <div className="w-full min-w-0">
            
            <h3 className="text-2xl font-bold text-[#173B67] sm:text-3xl">
              C. Neelima
            </h3>

            <p className="mt-1 font-semibold text-orange-500">
              Founder & CEO
            </p>

            <div className="mt-6 space-y-5 text-base leading-8 text-slate-600 sm:text-[17px]">

              <p>
                C. Neelima has been actively involved in education, training,
                and professional development since 2006, bringing over 20
                years of experience to the field. With a strong passion for
                empowering learners through practical and industry-oriented
                education, she has been instrumental in shaping SK Computer
                Education and its vision for accessible, career-focused
                learning.
              </p>

              <p>
                Her leadership focuses on providing students with quality
                training, practical skills, and the confidence they need to
                build successful careers in a rapidly evolving digital world.
              </p>

            </div>

            {/* Highlight */}
            <div className="mt-7 flex items-start gap-3">
              <div className="mt-1 h-10 w-1 shrink-0 rounded-full bg-orange-500" />

              <p className="text-sm font-semibold leading-6 text-[#173B67]">
                Empowering learners through practical, career-focused
                education
              </p>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}