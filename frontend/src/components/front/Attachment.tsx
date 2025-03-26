import { Card } from "react-bootstrap";
import { IAttachment } from "../../types/order";
import pdfImage from "../pdf-file.png";
import { Link } from "react-router-dom";
import { Status } from "../../enums/order";
import {FaRegThumbsUp, FaRedo} from "react-icons/fa";


interface MediaComponentProps {
  media: IAttachment;
  handleStatus: (_id: string | number | null, _status: string | null) => void
}

const Attachment: React.FC<MediaComponentProps> = ({ media, handleStatus }) => {
  return (
    <div className="d-flex align-items-start mb-3 border">
      <div className="p-2">
        <Link to={media.url} target="_blank">
          {media.ext === "pdf" ? (<Card.Img variant="top" src={pdfImage} width={100} height={180} />) : (<Card.Img variant="top" src={media.url} width={100} height={180} />)}
        </Link>
      </div>
      <div className="p-2">
        <h4>{media.name}</h4>
        {media.comment && (
          <p className="mb-1">{media.comment}</p>
        )}
        {media.status === Status.WAITING_FOR_APPROVAL && (
          <>
            <p className="item-action"><a onClick={(_e) => handleStatus(media.id, "Accept")} href="#" className="text-jewelry"> <FaRegThumbsUp /> Click Here To Approve</a></p>
            <p className="item-action"><a onClick={(_e) => handleStatus(media.id, "Revision")}  href="#" className="text-jewelry"><FaRedo /> Ask For Revision(Wait Time 3-5 Days)</a></p>
          </>
        )}
      </div>
    </div>
  );
};

export default Attachment;