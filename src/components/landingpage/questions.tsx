import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface FAQItem {
  question: String;
  answer: String;
}

const faqData: FAQItem[] = [
  {
    question: "What kind of submission files are accepted?",
    answer: "We accept PDF, TXT, and JSON files. We are working to expand to audio and code file support in the future!"
  },
  {
    question: "What are the use cases for ProfCelerate?",
    answer: "ProfCelerate was originally designed to help our Chinese professor with their repetitive grading tasks. What used to take them 2-3 hours, now takes them 10 minutes. Graders can define their own grading criterias, allowing us to handle a wide variety of assignemnts."
  },
  {
    question: "How is the homework graded?",
    answer: "We use cutting-edge AI models to grade the homework. We currently use Mistral and DeekSeek R1 models, considered the best in the industry."
  },
]


export const Questions: React.FC = () => {
  return (
    <div className="flex flex-col px-4 py-8">
      <h1 className="text-5xl md:text-6xl font-semibold mb-6 tracking-normal items-center text-center">
        Questions
      </h1>
      <Accordion type="single" className="px-20" collapsible>
        {faqData.map((item,index) => (
          <AccordionItem value={`item-${index}`} className="hover:bg-zinc-100 data-[state=open]:bg-zinc-100">
            <AccordionTrigger className="text-xl font-semibold">{item.question}</AccordionTrigger>
            <AccordionContent>{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

    </div>

  )
}