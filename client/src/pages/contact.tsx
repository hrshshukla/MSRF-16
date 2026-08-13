import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSubmitContact } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  subject: z.string().min(3, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type FormValues = z.infer<typeof formSchema>;

export function ContactPage() {
  const { toast } = useToast();
  const submitContact = useSubmitContact();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  function onSubmit(data: FormValues) {
    submitContact.mutate(
      { data },
      {
        onSuccess: () => {
          toast({
            title: "Message Sent",
            description: "We have received your message and will reply shortly.",
          });
          form.reset();
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to send message. Please try again.",
          });
        },
      }
    );
  }

  return (
    <div className="w-full pb-24 relative">
      <div className="bg-card border-b pt-24 pb-16 relative overflow-hidden">
        <div className="mandala-bg text-secondary opacity-[0.03]" />
        <div className="container mx-auto px-4 md:px-8 relative z-10 text-center max-w-3xl">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">Contact Us</h1>
          <p className="text-lg text-muted-foreground">
            Have a question, suggestion, or want to collaborate? Reach out to us. We are always eager to connect with like-minded individuals.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 mt-16 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Info */}
          <div className="lg:w-1/3 space-y-8">
            <h3 className="font-serif text-2xl font-bold mb-6">Get in Touch</h3>
            
            <div className="flex gap-4">
              <div className="w-12 h-12 shrink-0 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                <MapPin size={24} />
              </div>
              <div>
                <h4 className="font-bold text-lg mb-1">Headquarters</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  P No 116/A Narmada Ho Soc<br />
                  Borgaon Road<br />
                  Nagpur, Maharashtra
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 shrink-0 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                <Phone size={24} />
              </div>
              <div>
                <h4 className="font-bold text-lg mb-1">Phone</h4>
                <p className="text-muted-foreground text-sm">+91 98765 43210</p>
                <p className="text-muted-foreground text-sm">+91 12345 67890</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 shrink-0 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                <Mail size={24} />
              </div>
              <div>
                <h4 className="font-bold text-lg mb-1">Email</h4>
                <p className="text-muted-foreground text-sm">namaste@mahakal-sanatan.org</p>
                <p className="text-muted-foreground text-sm">press@mahakal-sanatan.org</p>
              </div>
            </div>

            <div className="p-6 bg-card border rounded-2xl shadow-sm mt-8">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="text-secondary" />
                <h4 className="font-bold text-lg">Office Hours</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex justify-between"><span>Mon - Fri</span> <span>9:00 AM - 6:00 PM</span></li>
                <li className="flex justify-between"><span>Saturday</span> <span>10:00 AM - 2:00 PM</span></li>
                <li className="flex justify-between"><span>Sunday</span> <span>Closed</span></li>
              </ul>
            </div>
          </div>

          {/* Form */}
          <div className="lg:w-2/3 bg-card border rounded-3xl p-8 md:p-12 shadow-sm">
            <h3 className="font-serif text-2xl font-bold mb-8">Send a Message</h3>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" className="h-12 bg-background" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" className="h-12 bg-background" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                           <Input
                          {...field}
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          placeholder="Enter phone number"
                          className="h-12 bg-background"
                          onChange={(e) => {
                            const value = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 10);

                            field.onChange(value);
                          }}
                        />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="How can we help?" className="h-12 bg-background" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Your message here..." 
                          className="min-h-[160px] resize-none bg-background" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full md:w-auto h-14 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white gap-2"
                  disabled={submitContact.isPending}
                >
                  {submitContact.isPending ? "Sending..." : "Send Message"}
                  {!submitContact.isPending && <Send size={18} />}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
